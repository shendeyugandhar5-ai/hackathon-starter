import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();

  const { ensureStudentProfile } = useAuth();

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        if (!supabase) {
          throw new Error(
            "Supabase is not configured.",
          );
        }

        /*
         * =====================================================
         * STEP 1 — Check for PKCE authorization code
         * =====================================================
         *
         * Example:
         *
         * /auth/callback?code=xxxxx
         *
         */

        const params = new URLSearchParams(
          window.location.search,
        );

        const code = params.get("code");

        if (code) {
          const {
            data,
            error: exchangeError,
          } = await supabase.auth.exchangeCodeForSession(
            code,
          );

          if (exchangeError) {
            throw exchangeError;
          }

          if (data?.user) {
            await ensureStudentProfile(
              data.user,
            );
          }
        } else {
          /*
           * ===================================================
           * STEP 2 — Handle Supabase implicit/hash flow
           * ===================================================
           *
           * Your current browser URL looks like:
           *
           * /auth/callback#
           *
           * In this flow Supabase processes the tokens
           * contained in the URL hash and creates the session.
           *
           * We therefore retrieve the session directly.
           */

          const {
            data: {
              session,
            },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (!session?.user) {
            throw new Error(
              "Google authentication completed, but no Supabase session was found.",
            );
          }

          /*
           * Create the EduHive student profile if this
           * is a new Google account.
           */

          await ensureStudentProfile(
            session.user,
          );
        }

        /*
         * =====================================================
         * STEP 3 — Send authenticated user to Tutor
         * =====================================================
         */

        if (mounted) {
          navigate("/app/tutor", {
            replace: true,
          });
        }
      } catch (err) {
        console.error(
          "Google OAuth callback error:",
          err,
        );

        if (mounted) {
          setError(
            err?.message ||
              "Google authentication failed. Please try again.",
          );
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, ensureStudentProfile]);

  /*
   * =========================================================
   * ERROR STATE
   * =========================================================
   */

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#EAE5DC] rounded-xl p-8 text-center shadow-sm">
          <h2 className="font-serif text-2xl text-[#1C1917]">
            Authentication failed
          </h2>

          <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                replace: true,
              })
            }
            className="mt-6 px-6 py-3 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-sm font-semibold transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * LOADING STATE
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#EAE5DC] border-t-[#A8421E] rounded-full animate-spin mx-auto" />

        <p className="mt-4 text-sm text-[#57534E]">
          Completing Google sign-in...
        </p>

        <p className="mt-1 text-xs text-[#8C827A]">
          Setting up your EduHive learning space
        </p>
      </div>
    </div>
  );
}