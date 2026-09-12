import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import {
  supabase,
  isSupabaseConfigured,
} from "../lib/supabase";

const AuthContext = createContext(null);

const LOCAL_STORAGE_SESSION_KEY =
  "eduhive_auth_session";

const LOCAL_STORAGE_USERS_KEY =
  "eduhive_registered_users";

const DEFAULT_GOAL = "Placement Preparation";

const DEFAULT_AGENTS = [
  "dsa",
  "dbms",
  "maths",
  "aiml",
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // =========================================================
  // BUILD STUDENT PROFILE
  // =========================================================

  const buildStudentProfile = (
    userData,
    studentData = null,
  ) => {
    if (!userData && !studentData) {
      return null;
    }

    const meta = userData?.user_metadata || {};

    const fullName =
      studentData?.name ||
      meta.full_name ||
      meta.name ||
      userData?.email?.split("@")[0] ||
      "";

    const nameParts = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    let initials = "EH";

    if (nameParts.length >= 2) {
      initials = (
        nameParts[0][0] +
        nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    } else if (nameParts.length === 1) {
      initials = nameParts[0]
        .slice(0, 2)
        .toUpperCase();
    } else if (userData?.email) {
      initials = userData.email
        .slice(0, 2)
        .toUpperCase();
    }

    const goal =
      studentData?.goal ||
      meta.goal ||
      DEFAULT_GOAL;

    const focusTutors =
      studentData?.focus_tutors ||
      meta.active_agents ||
      DEFAULT_AGENTS;

    const academicEmail =
      studentData?.academic_email ||
      userData?.email ||
      "";

    const onboardingCompleted =
      studentData
        ? Boolean(studentData.onboarding_completed)
        : Boolean(meta.onboarding_completed);

    return {
      id:
        studentData?.id ||
        userData?.id,

      auth_user_id:
        userData?.id,

      student_id:
        studentData?.id,

      name: fullName,

      full_name: fullName,

      academic_email: academicEmail,

      email: academicEmail,

      goal,

      focus_tutors: focusTutors,

      active_agents: focusTutors,

      onboarding_completed:
        onboardingCompleted,

      updated_at:
        studentData?.updated_at || null,

      created_at:
        studentData?.created_at ||
        userData?.created_at ||
        new Date().toISOString(),

      initials,

      track: goal
        ? `${goal} Track`
        : `${DEFAULT_GOAL} Track`,

      mastery: 0,

      hasStudentRow:
        Boolean(studentData),
    };
  };

  // =========================================================
  // ENSURE STUDENT PROFILE
  // =========================================================
  //
  // This is especially important for Google OAuth users.
  //
  // Supabase creates:
  // auth.users
  //
  // But EduHive also needs:
  // public.students
  //
  // =========================================================

  const ensureStudentProfile = async (
    currentUser,
    options = {},
  ) => {
    if (!currentUser) {
      return null;
    }

    if (
      !isSupabaseConfigured ||
      !supabase
    ) {
      return null;
    }

    try {
      // -------------------------------------------------------
      // Check whether student row already exists
      // -------------------------------------------------------

      const {
        data: existingStudent,
        error: lookupError,
      } = await supabase
        .from("students")
        .select("*")
        .eq(
          "auth_user_id",
          currentUser.id,
        )
        .maybeSingle();

      if (lookupError) {
        console.warn(
          "Unable to check student profile:",
          lookupError,
        );

        return null;
      }

      // -------------------------------------------------------
      // Existing student
      // -------------------------------------------------------

      if (existingStudent) {
        const existingProfile =
          buildStudentProfile(
            currentUser,
            existingStudent,
          );

        setProfile(existingProfile);

        return existingProfile;
      }

      // -------------------------------------------------------
      // Build profile for a new Google user
      // -------------------------------------------------------

      const metadata =
        currentUser.user_metadata || {};

      const name =
        options.name ||
        metadata.full_name ||
        metadata.name ||
        currentUser.email?.split("@")[0] ||
        "Learner";

      const goal =
        options.goal ||
        metadata.goal ||
        DEFAULT_GOAL;

      const focusTutors =
        options.activeAgents ||
        metadata.active_agents ||
        DEFAULT_AGENTS;

      const newStudent = {
        auth_user_id: currentUser.id,

        name: name.trim(),

        academic_email:
          currentUser.email || "",

        goal,

        focus_tutors:
          Array.isArray(focusTutors)
            ? focusTutors
            : DEFAULT_AGENTS,

        onboarding_completed: true,

        updated_at:
          new Date().toISOString(),
      };

      const {
        data: createdStudent,
        error: insertError,
      } = await supabase
        .from("students")
        .insert(newStudent)
        .select()
        .single();

      if (insertError) {
        console.error(
          "Failed to create student profile:",
          insertError,
        );

        // Don't destroy authentication just because
        // the custom profile could not be created.
        const fallbackProfile =
          buildStudentProfile(
            currentUser,
            null,
          );

        setProfile(fallbackProfile);

        return fallbackProfile;
      }

      const createdProfile =
        buildStudentProfile(
          currentUser,
          createdStudent,
        );

      setProfile(createdProfile);

      return createdProfile;
    } catch (error) {
      console.error(
        "Student profile creation error:",
        error,
      );

      const fallbackProfile =
        buildStudentProfile(
          currentUser,
          null,
        );

      setProfile(fallbackProfile);

      return fallbackProfile;
    }
  };

  // =========================================================
  // FETCH STUDENT PROFILE
  // =========================================================

  const fetchProfile = async (
    currentUser,
  ) => {
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    if (
      isSupabaseConfigured &&
      supabase
    ) {
      try {
        const {
          data,
          error,
        } = await supabase
          .from("students")
          .select("*")
          .eq(
            "auth_user_id",
            currentUser.id,
          )
          .maybeSingle();

        if (error) {
          console.warn(
            "Error querying public.students:",
            error,
          );

          const fallbackProfile =
            buildStudentProfile(
              currentUser,
              null,
            );

          setProfile(fallbackProfile);

          return fallbackProfile;
        }

        if (data) {
          const profileObj =
            buildStudentProfile(
              currentUser,
              data,
            );

          setProfile(profileObj);

          return profileObj;
        }

        const uninitializedProfile =
          buildStudentProfile(
            currentUser,
            null,
          );

        setProfile(
          uninitializedProfile,
        );

        return uninitializedProfile;
      } catch (error) {
        console.warn(
          "Profile fetch warning:",
          error,
        );

        const fallbackProfile =
          buildStudentProfile(
            currentUser,
            null,
          );

        setProfile(fallbackProfile);

        return fallbackProfile;
      }
    }

    // =======================================================
    // LOCAL FALLBACK
    // =======================================================

    const rawUsers =
      localStorage.getItem(
        LOCAL_STORAGE_USERS_KEY,
      );

    const registeredUsers =
      rawUsers
        ? JSON.parse(rawUsers)
        : [];

    const matched =
      registeredUsers.find(
        (u) =>
          u.id === currentUser.id ||
          u.email === currentUser.email,
      );

    const profileObj =
      buildStudentProfile(
        currentUser,
        matched?.student_profile ||
          null,
      );

    setProfile(profileObj);

    return profileObj;
  };

  // =========================================================
  // UPDATE STUDENT PROFILE
  // =========================================================

  const updateStudentProfile = async ({
    name,
    goal,
    focus_tutors,
  }) => {
    if (!user) {
      throw new Error(
        "No authenticated user session found.",
      );
    }

    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const payload = {
        name: name.trim(),

        goal: goal.trim(),

        focus_tutors:
          Array.isArray(focus_tutors)
            ? focus_tutors
            : [],

        updated_at:
          new Date().toISOString(),
      };

      const {
        data: existingRow,
      } = await supabase
        .from("students")
        .select("id")
        .eq(
          "auth_user_id",
          user.id,
        )
        .maybeSingle();

      let savedData = null;

      if (existingRow) {
        const {
          data,
          error,
        } = await supabase
          .from("students")
          .update(payload)
          .eq(
            "auth_user_id",
            user.id,
          )
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedData = data;
      } else {
        const newRow = {
          auth_user_id: user.id,

          academic_email:
            user.email || "",

          onboarding_completed:
            true,

          ...payload,
        };

        const {
          data,
          error,
        } = await supabase
          .from("students")
          .insert(newRow)
          .select()
          .single();

        if (error) {
          throw error;
        }

        savedData = data;
      }

      const updatedProfile =
        buildStudentProfile(
          user,
          savedData,
        );

      setProfile(updatedProfile);

      return updatedProfile;
    }

    // =======================================================
    // LOCAL FALLBACK
    // =======================================================

    const rawUsers =
      localStorage.getItem(
        LOCAL_STORAGE_USERS_KEY,
      );

    const registeredUsers =
      rawUsers
        ? JSON.parse(rawUsers)
        : [];

    const userIndex =
      registeredUsers.findIndex(
        (u) =>
          u.id === user.id ||
          u.email === user.email,
      );

    const studentData = {
      id: "student-" + user.id,

      auth_user_id: user.id,

      name: name.trim(),

      academic_email:
        user.email || "",

      goal: goal.trim(),

      focus_tutors:
        Array.isArray(focus_tutors)
          ? focus_tutors
          : [],

      onboarding_completed:
        true,

      updated_at:
        new Date().toISOString(),
    };

    if (userIndex !== -1) {
      registeredUsers[
        userIndex
      ].student_profile =
        studentData;

      localStorage.setItem(
        LOCAL_STORAGE_USERS_KEY,
        JSON.stringify(
          registeredUsers,
        ),
      );
    }

    const updatedProfile =
      buildStudentProfile(
        user,
        studentData,
      );

    setProfile(updatedProfile);

    return updatedProfile;
  };

  // =========================================================
  // INITIALIZE AUTH
  // =========================================================

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    async function initAuth() {
      try {
        if (
          isSupabaseConfigured &&
          supabase
        ) {
          const {
            data: {
              session:
                initialSession,
            },
          } =
            await supabase.auth.getSession();

          if (!mounted) {
            return;
          }

          setSession(
            initialSession,
          );

          setUser(
            initialSession?.user ||
              null,
          );

          if (
            initialSession?.user
          ) {
            await fetchProfile(
              initialSession.user,
            );
          }

          // ---------------------------------------------------
          // Auth listener
          //
          // IMPORTANT:
          // Don't perform a long async profile operation
          // directly inside the Supabase auth callback.
          // ---------------------------------------------------

          const {
            data: {
              subscription,
            },
          } =
            supabase.auth.onAuthStateChange(
              (_event, newSession) => {
                if (!mounted) {
                  return;
                }

                setSession(
                  newSession,
                );

                setUser(
                  newSession?.user ||
                    null,
                );

                if (
                  !newSession?.user
                ) {
                  setProfile(null);
                }

                setLoading(false);

                // Run profile fetching after the auth
                // callback has returned.
                if (
                  newSession?.user
                ) {
                  setTimeout(() => {
                    if (mounted) {
                      fetchProfile(
                        newSession.user,
                      );
                    }
                  }, 0);
                }
              },
            );

          authSubscription =
            subscription;
        } else {
          // ---------------------------------------------------
          // LOCAL SESSION
          // ---------------------------------------------------

          const savedSession =
            localStorage.getItem(
              LOCAL_STORAGE_SESSION_KEY,
            );

          if (savedSession) {
            try {
              const parsed =
                JSON.parse(
                  savedSession,
                );

              if (
                parsed?.user
              ) {
                setUser(
                  parsed.user,
                );

                setSession(
                  parsed,
                );

                setProfile(
                  buildStudentProfile(
                    parsed.user,
                    parsed.user
                      .student_profile,
                  ),
                );
              }
            } catch {
              localStorage.removeItem(
                LOCAL_STORAGE_SESSION_KEY,
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "Auth initialization error:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  // =========================================================
  // EMAIL / PASSWORD SIGN IN
  // =========================================================

  const signIn = async ({
    email,
    password,
  }) => {
    setAuthError(null);

    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: email.trim(),
            password,
          },
        );

      if (error) {
        setAuthError(
          error.message,
        );

        throw error;
      }

      setUser(data.user);

      setSession(data.session);

      await fetchProfile(
        data.user,
      );

      return data;
    }

    // =======================================================
    // LOCAL FALLBACK
    // =======================================================

    const rawUsers =
      localStorage.getItem(
        LOCAL_STORAGE_USERS_KEY,
      );

    const registeredUsers =
      rawUsers
        ? JSON.parse(rawUsers)
        : [];

    const matchedUser =
      registeredUsers.find(
        (u) =>
          u.email.toLowerCase() ===
            email
              .trim()
              .toLowerCase() &&
          u.password === password,
      );

    if (!matchedUser) {
      const error =
        new Error(
          "Invalid email or password. Please verify your academic credentials.",
        );

      setAuthError(
        error.message,
      );

      throw error;
    }

    const localSession = {
      access_token:
        "mock-jwt-token-" +
        Date.now(),

      user: matchedUser,
    };

    localStorage.setItem(
      LOCAL_STORAGE_SESSION_KEY,
      JSON.stringify(
        localSession,
      ),
    );

    setUser(matchedUser);

    setSession(localSession);

    setProfile(
      buildStudentProfile(
        matchedUser,
        matchedUser.student_profile,
      ),
    );

    return {
      user: matchedUser,
      session: localSession,
    };
  };

  // =========================================================
  // EMAIL / PASSWORD SIGN UP
  // =========================================================

  const signUp = async ({
    email,
    password,
    fullName,
    goal,
    activeAgents,
  }) => {
    setAuthError(null);

    const userMetadata = {
      full_name:
        fullName.trim(),

      goal:
        goal ||
        DEFAULT_GOAL,

      active_agents:
        Array.isArray(
          activeAgents,
        )
          ? activeAgents
          : DEFAULT_AGENTS,
    };

    if (
      isSupabaseConfigured &&
      supabase
    ) {
      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              email.trim(),

            password,

            options: {
              data: userMetadata,
            },
          },
        );

      if (error) {
        setAuthError(
          error.message,
        );

        throw error;
      }

      // -------------------------------------------------------
      // If Supabase immediately gives us a session,
      // create the student profile.
      // -------------------------------------------------------

      if (
        data.user &&
        data.session
      ) {
        await ensureStudentProfile(
          data.user,
          {
            name: fullName,
            goal:
              goal ||
              DEFAULT_GOAL,
            activeAgents,
          },
        );

        setUser(data.user);

        setSession(
          data.session,
        );

        await fetchProfile(
          data.user,
        );
      }

      const needsEmailConfirmation =
        Boolean(
          data.user &&
            !data.session,
        );

      return {
        user: data.user,

        session:
          data.session,

        needsEmailConfirmation,
      };
    }

    // =======================================================
    // LOCAL FALLBACK
    // =======================================================

    const rawUsers =
      localStorage.getItem(
        LOCAL_STORAGE_USERS_KEY,
      );

    const registeredUsers =
      rawUsers
        ? JSON.parse(rawUsers)
        : [];

    const existing =
      registeredUsers.find(
        (u) =>
          u.email.toLowerCase() ===
          email
            .trim()
            .toLowerCase(),
      );

    if (existing) {
      const error =
        new Error(
          "An account with this academic email already exists.",
        );

      setAuthError(
        error.message,
      );

      throw error;
    }

    const userId =
      "user-" +
      Math.random()
        .toString(36)
        .substring(2, 9);

    const studentData = {
      id:
        "student-" +
        userId,

      auth_user_id:
        userId,

      name:
        fullName.trim(),

      academic_email:
        email.trim(),

      goal:
        goal ||
        DEFAULT_GOAL,

      focus_tutors:
        Array.isArray(
          activeAgents,
        )
          ? activeAgents
          : DEFAULT_AGENTS,

      onboarding_completed:
        true,

      updated_at:
        new Date().toISOString(),
    };

    const newUser = {
      id: userId,

      email:
        email.trim(),

      password,

      user_metadata:
        userMetadata,

      student_profile:
        studentData,

      created_at:
        new Date().toISOString(),
    };

    registeredUsers.push(
      newUser,
    );

    localStorage.setItem(
      LOCAL_STORAGE_USERS_KEY,
      JSON.stringify(
        registeredUsers,
      ),
    );

    const localSession = {
      access_token:
        "mock-jwt-token-" +
        Date.now(),

      user: newUser,
    };

    localStorage.setItem(
      LOCAL_STORAGE_SESSION_KEY,
      JSON.stringify(
        localSession,
      ),
    );

    setUser(newUser);

    setSession(
      localSession,
    );

    setProfile(
      buildStudentProfile(
        newUser,
        studentData,
      ),
    );

    return {
      user: newUser,

      session:
        localSession,

      needsEmailConfirmation:
        false,
    };
  };

  // =========================================================
  // GOOGLE OAUTH
  // =========================================================

  const signInWithGoogle =
    async () => {
      setAuthError(null);

      if (
        !isSupabaseConfigured ||
        !supabase
      ) {
        const error =
          new Error(
            "Google sign-in requires Supabase to be configured for this deployment.",
          );

        setAuthError(
          error.message,
        );

        throw error;
      }

      /*
       * OAuth flow:
       *
       * EduHive
       *    ↓
       * Supabase
       *    ↓
       * Google
       *    ↓
       * /auth/callback
       *    ↓
       * exchangeCodeForSession()
       *    ↓
       * /app/tutor
       */

      const redirectTo =
        `${window.location.origin}/auth/callback`;

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",

            options: {
              redirectTo,
            },
          },
        );

      if (error) {
        setAuthError(
          error.message,
        );

        throw error;
      }

      return data;
    };

  // =========================================================
  // SIGN OUT
  // =========================================================

  const signOut =
    async () => {
      setAuthError(null);

      if (
        isSupabaseConfigured &&
        supabase
      ) {
        const {
          error,
        } =
          await supabase.auth.signOut();

        if (error) {
          setAuthError(
            error.message,
          );

          throw error;
        }
      } else {
        localStorage.removeItem(
          LOCAL_STORAGE_SESSION_KEY,
        );
      }

      setUser(null);

      setSession(null);

      setProfile(null);
    };

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {
    user,

    session,

    profile,

    loading,

    authError,

    setAuthError,

    isAuthenticated:
      Boolean(user),

    signIn,

    signUp,

    signInWithGoogle,

    signOut,

    fetchProfile,

    ensureStudentProfile,

    updateStudentProfile,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================================
// USE AUTH
// ===========================================================

export function useAuth() {
  const context =
    useContext(
      AuthContext,
    );

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }

  return context;
}