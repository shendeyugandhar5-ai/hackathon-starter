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

  // Helper to construct profile object from user and metadata/table
  const buildProfile = (userData, profileData = {}) => {
    const meta = userData?.user_metadata || {};
    const fullName = profileData?.full_name || meta.full_name || userData?.email?.split('@')[0] || studentProfile.name;
    const nameParts = fullName.trim().split(' ');
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

    return {
      id: userData?.id,
      email: userData?.email,
      full_name: fullName,
      initials: initials,
      goal: profileData?.goal || meta.goal || 'Placement Preparation',
      track: profileData?.track || meta.track || 'Data Science Track',
      cohort: profileData?.cohort || 'Data Science & ML Engineering Cohort',
      active_agents: profileData?.active_agents || meta.active_agents || ['dsa', 'dbms', 'maths', 'aiml'],
      mastery: profileData?.mastery ?? studentProfile.overallMastery,
      created_at: profileData?.created_at || userData?.created_at || new Date().toISOString()
    };
  };

  // Fetch or create profile from Supabase Database
  const fetchProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (data) {
          setProfile(buildProfile(currentUser, data));
          return;
        }

        // If no profile record yet, create one
        const initialProfile = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
          email: currentUser.email,
          goal: currentUser.user_metadata?.goal || 'Placement Preparation',
          track: 'Data Science Track',
          active_agents: currentUser.user_metadata?.active_agents || ['dsa', 'dbms', 'maths', 'aiml'],
          created_at: new Date().toISOString()
        };

        await supabase.from('profiles').upsert(initialProfile);
        setProfile(buildProfile(currentUser, initialProfile));
      } catch (err) {
        console.warn('Profile fetch warning (falling back to user metadata):', err);
        setProfile(buildProfile(currentUser));
      }
    } else {
      // Local fallback mode
      setProfile(buildProfile(currentUser, currentUser.profile));
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
                setProfile(buildProfile(parsed.user, parsed.user.profile));
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
            full_name: studentProfile.name,
            goal: 'Placement Preparation',
            track: 'Data Science Track',
            active_agents: ['dsa', 'dbms', 'maths', 'aiml']
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
      setProfile(buildProfile(matchedUser));
      return { user: matchedUser, session: localSession };
    }
  };

  // 2. Sign Up (Registration)
  const signUp = async ({ email, password, fullName, goal, activeAgents }) => {
    setAuthError(null);

    const userMetadata = {
      full_name: fullName,
      goal: goal || 'Placement Preparation',
      track: 'Data Science Track',
      active_agents: activeAgents || ['dsa', 'dbms', 'maths', 'aiml']
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

      // Check if email confirmation is required
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

      const newUser = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email: email.trim(),
        password, // for local validation only
        user_metadata: userMetadata,
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
      setProfile(buildProfile(newUser));

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
    fetchProfile
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
