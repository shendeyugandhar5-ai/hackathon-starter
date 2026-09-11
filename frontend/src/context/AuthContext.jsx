import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { studentProfile } from '../data/mockData';

const AuthContext = createContext(null);

const LOCAL_STORAGE_SESSION_KEY = 'eduhive_auth_session';
const LOCAL_STORAGE_USERS_KEY = 'eduhive_registered_users';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper to construct profile object from student record and auth user
  const buildStudentProfile = (userData, studentData = null) => {
    if (!userData && !studentData) return null;

    const meta = userData?.user_metadata || {};
    const fullName = studentData?.name || meta.full_name || userData?.email?.split('@')[0] || '';
    
    // Generate initials: "Rahul Sharma" -> "RS", "Alex Morgan" -> "AM"
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    let initials = 'EH';
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length > 0) {
      initials = nameParts[0].slice(0, 2).toUpperCase();
    } else if (userData?.email) {
      initials = userData.email.slice(0, 2).toUpperCase();
    }

    const goal = studentData?.goal || meta.goal || 'Placement Preparation';
    const focusTutors = studentData?.focus_tutors || meta.active_agents || ['dsa', 'dbms', 'maths', 'aiml'];
    const academicEmail = studentData?.academic_email || userData?.email || '';
    const onboardingCompleted = studentData ? Boolean(studentData.onboarding_completed) : Boolean(meta.onboarding_completed);

    return {
      id: studentData?.id || userData?.id,
      auth_user_id: userData?.id,
      student_id: studentData?.id,
      name: fullName,
      full_name: fullName,
      academic_email: academicEmail,
      email: academicEmail,
      goal: goal,
      focus_tutors: focusTutors,
      active_agents: focusTutors,
      onboarding_completed: onboardingCompleted,
      updated_at: studentData?.updated_at || null,
      created_at: studentData?.created_at || userData?.created_at || new Date().toISOString(),
      initials: initials,
      track: goal ? `${goal} Track` : 'Placement Preparation Track',
      mastery: studentProfile.overallMastery,
      hasStudentRow: Boolean(studentData)
    };
  };

  // Fetch student profile from public.students using auth_user_id
  const fetchProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('auth_user_id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.warn('Error querying public.students table:', error);
        }

        if (data) {
          const profileObj = buildStudentProfile(currentUser, data);
          setProfile(profileObj);
          return profileObj;
        }

        // If no student row exists yet, check user_metadata or mark uninitialized
        const uninitializedProfile = buildStudentProfile(currentUser, null);
        setProfile(uninitializedProfile);
        return uninitializedProfile;
      } catch (err) {
        console.warn('Profile fetch warning (falling back to user metadata):', err);
        const fallbackProfile = buildStudentProfile(currentUser, null);
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
    } else {
      // Local fallback mode
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const registeredUsers = rawUsers ? JSON.parse(rawUsers) : [];
      const matched = registeredUsers.find((u) => u.id === currentUser.id || u.email === currentUser.email);
      const profileObj = buildStudentProfile(currentUser, matched?.student_profile || null);
      setProfile(profileObj);
      return profileObj;
    }
  };

  // Update student profile in public.students table
  const updateStudentProfile = async ({ name, goal, focus_tutors }) => {
    if (!user) {
      throw new Error('No authenticated user session found.');
    }

    if (isSupabaseConfigured && supabase) {
      const payload = {
        name: name.trim(),
        goal: goal.trim(),
        focus_tutors: Array.isArray(focus_tutors) ? focus_tutors : [],
        updated_at: new Date().toISOString()
      };

      // Check if student row already exists
      const { data: existingRow } = await supabase
        .from('students')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      let savedData = null;

      if (existingRow) {
        const { data, error } = await supabase
          .from('students')
          .update(payload)
          .eq('auth_user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        savedData = data;
      } else {
        // Create the student row if missing
        const newRow = {
          auth_user_id: user.id,
          academic_email: user.email,
          onboarding_completed: true,
          ...payload
        };

        const { data, error } = await supabase
          .from('students')
          .insert(newRow)
          .select()
          .single();

        if (error) throw error;
        savedData = data;
      }

      const updatedProfile = buildStudentProfile(user, savedData);
      setProfile(updatedProfile);
      return updatedProfile;
    } else {
      // Local fallback
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const registeredUsers = rawUsers ? JSON.parse(rawUsers) : [];
      const userIndex = registeredUsers.findIndex((u) => u.id === user.id || u.email === user.email);

      const studentData = {
        id: 'student-' + user.id,
        auth_user_id: user.id,
        name: name.trim(),
        academic_email: user.email,
        goal: goal.trim(),
        focus_tutors: Array.isArray(focus_tutors) ? focus_tutors : [],
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      if (userIndex !== -1) {
        registeredUsers[userIndex].student_profile = studentData;
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(registeredUsers));
      }

      const updatedProfile = buildStudentProfile(user, studentData);
      setProfile(updatedProfile);
      return updatedProfile;
    }
  };

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession?.user || null);
            if (initialSession?.user) {
              await fetchProfile(initialSession.user);
            }
          }

          // Listen to auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (mounted) {
              setSession(newSession);
              setUser(newSession?.user || null);
              if (newSession?.user) {
                await fetchProfile(newSession.user);
              } else {
                setProfile(null);
              }
              setLoading(false);
            }
          });

          return () => {
            subscription?.unsubscribe();
          };
        } else {
          // Check local storage session
          const savedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              if (parsed?.user) {
                setUser(parsed.user);
                setSession(parsed);
                setProfile(buildStudentProfile(parsed.user, parsed.user.student_profile));
              }
            } catch (e) {
              localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 1. Sign In
  const signIn = async ({ email, password }) => {
    setAuthError(null);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user);
      return data;
    } else {
      // Local fallback mode
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const registeredUsers = rawUsers ? JSON.parse(rawUsers) : [];
      
      // Default demo account or registered user
      let matchedUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );

      // Support default student login seamlessly
      if (!matchedUser && (email.toLowerCase().includes('rahul') || email.toLowerCase().includes('university.edu') || password === 'password123')) {
        matchedUser = {
          id: 'mock-user-0889',
          email: email.trim(),
          user_metadata: {
            full_name: 'Rahul Sharma',
            goal: 'Placement Preparation',
            active_agents: ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor']
          },
          student_profile: {
            id: 'mock-student-0889',
            auth_user_id: 'mock-user-0889',
            name: 'Rahul Sharma',
            academic_email: email.trim(),
            goal: 'Placement Preparation',
            focus_tutors: ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor'],
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          }
        };
      }

      if (!matchedUser) {
        const error = new Error('Invalid email or password. Please verify your academic credentials.');
        setAuthError(error.message);
        throw error;
      }

      const localSession = {
        access_token: 'mock-jwt-token-' + Date.now(),
        user: matchedUser
      };

      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(localSession));
      setUser(matchedUser);
      setSession(localSession);
      setProfile(buildStudentProfile(matchedUser, matchedUser.student_profile));
      return { user: matchedUser, session: localSession };
    }
  };

  // 2. Sign Up (Registration)
  const signUp = async ({ email, password, fullName, goal, activeAgents }) => {
    setAuthError(null);

    const userMetadata = {
      full_name: fullName,
      goal: goal || 'Placement Preparation',
      active_agents: activeAgents || ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor']
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: userMetadata
        }
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      // If user signed up and session is established, insert row into public.students
      if (data.user) {
        try {
          await supabase.from('students').insert({
            auth_user_id: data.user.id,
            name: fullName.trim(),
            academic_email: email.trim(),
            goal: goal || 'Placement Preparation',
            focus_tutors: activeAgents || ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor'],
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Initial student record creation note:', dbErr);
        }
      }

      const needsEmailConfirmation = data.user && !data.session;

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user);
      }

      return {
        user: data.user,
        session: data.session,
        needsEmailConfirmation
      };
    } else {
      // Local fallback mode
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const registeredUsers = rawUsers ? JSON.parse(rawUsers) : [];

      const existing = registeredUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (existing) {
        const error = new Error('An account with this academic email already exists.');
        setAuthError(error.message);
        throw error;
      }

      const userId = 'user-' + Math.random().toString(36).substring(2, 9);
      const studentData = {
        id: 'student-' + userId,
        auth_user_id: userId,
        name: fullName.trim(),
        academic_email: email.trim(),
        goal: goal || 'Placement Preparation',
        focus_tutors: activeAgents || ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor'],
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      const newUser = {
        id: userId,
        email: email.trim(),
        password, // for local validation only
        user_metadata: userMetadata,
        student_profile: studentData,
        created_at: new Date().toISOString()
      };

      registeredUsers.push(newUser);
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(registeredUsers));

      const localSession = {
        access_token: 'mock-jwt-token-' + Date.now(),
        user: newUser
      };

      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(localSession));
      setUser(newUser);
      setSession(localSession);
      setProfile(buildStudentProfile(newUser, studentData));

      return {
        user: newUser,
        session: localSession,
        needsEmailConfirmation: false
      };
    }
  };

  // 3. Sign Out
  const signOut = async () => {
    setAuthError(null);

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }

    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    authError,
    setAuthError,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
    fetchProfile,
    updateStudentProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
