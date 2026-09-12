import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Check,
  Network,
  Cpu,
  Layers,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();

  const { signUp, signInWithGoogle, isAuthenticated } = useAuth();

  // =========================================================
  // FORM STATE
  // =========================================================

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [targetTrajectories, setTargetTrajectories] = useState(["placement"]);

  const [activeAgents, setActiveAgents] = useState([
    "dsa",
    "dbms",
    "maths",
    "aiml",
  ]);

  const [termsAgreed, setTermsAgreed] = useState(true);

  // =========================================================
  // AUTH / UI STATE
  // =========================================================

  const [errorMessage, setErrorMessage] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const [emailConfirmationRequired, setEmailConfirmationRequired] =
    useState(false);

  // =========================================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // =========================================================

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app/tutor", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // =========================================================
  // GOOGLE OAUTH
  // =========================================================

  const handleGoogleSignIn = async () => {
    // Prevent duplicate OAuth requests
    if (isGoogleSubmitting || isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsGoogleSubmitting(true);

    try {
      /*
       * signInWithGoogle() is handled by AuthContext.
       *
       * Supabase will redirect:
       *
       * Register
       *    ↓
       * Supabase
       *    ↓
       * Google
       *    ↓
       * /auth/callback
       *    ↓
       * /app/tutor
       */
      await signInWithGoogle();

      // The browser will normally leave this page
      // and redirect to Google's authentication page.
    } catch (err) {
      console.error("Google registration error:", err);

      setErrorMessage(
        err?.message ||
          "Google registration is unavailable right now. Please try again.",
      );

      setIsGoogleSubmitting(false);
    }
  };

  // =========================================================
  // AGENT SELECTION
  // =========================================================

  const toggleAgent = (id) => {
    setActiveAgents((current) => {
      if (current.includes(id)) {
        return current.filter((agent) => agent !== id);
      }

      return [...current, id];
    });
  };

  // =========================================================
  // TRAJECTORY SELECTION
  // =========================================================

  const toggleTrajectory = (id) => {
    setTargetTrajectories((current) =>
      current.includes(id)
        ? current.filter((trajectory) => trajectory !== id)
        : [...current, id],
    );
  };

  // =========================================================
  // EMAIL / PASSWORD REGISTRATION
  // =========================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (isSubmitting || isGoogleSubmitting) {
      return;
    }

    setErrorMessage(null);

    // Password validation
    if (password !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match. Please ensure both passwords are identical.",
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    // Goal validation
    if (targetTrajectories.length === 0) {
      setErrorMessage("Please select at least one preparation goal.");
      return;
    }

    // Terms validation
    if (!termsAgreed) {
      setErrorMessage("Please accept EduHive Academic Terms to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),

        goal: targetTrajectories
          .map((trajectory) =>
            trajectory === "placement" ? "Placement Preparation" : trajectory,
          )
          .join(", "),

        activeAgents,
      });

      if (result?.needsEmailConfirmation) {
        setEmailConfirmationRequired(true);
      } else {
        navigate("/app/tutor", {
          replace: true,
        });
      }
    } catch (err) {
      console.error("Registration error:", err);

      setErrorMessage(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col lg:flex-row">
      {/* =========================================================
          BACK TO LANDING
      ========================================================== */}

      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Back to homepage"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/85 backdrop-blur-xs border border-[#EAE5DC] text-[#57534E] hover:text-[#1C1917] hover:bg-white hover:border-[#D4CCBE] shadow-2xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A8421E]/40"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* =========================================================
          LEFT COLUMN
      ========================================================== */}

      <div className="lg:w-5/12 bg-[#F7F2EA] p-8 lg:p-12 flex flex-col justify-between border-r border-[#E2DAD0]">
        <div>
          {/* Logo */}

          <Link
            to="/"
            aria-label="EduHive home"
            className="inline-flex items-center"
          >
            <img
              src="/eduhive_white_logo.png"
              alt="EduHive"
              className="h-8 w-auto object-contain select-none"
              draggable={false}
            />
          </Link>

          {/* Intro */}

          <div className="mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE2D5] text-[#57534E] font-mono text-[10px] font-semibold tracking-wider uppercase border border-[#DDD5C5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8421E]" />
              PERSONALIZED AGENTIC LEARNING
            </div>

            <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#1C1917] tracking-tight mt-3 leading-snug">
              Build your learning hive.
            </h1>

            <p className="mt-2 text-xs lg:text-sm text-[#57534E] leading-relaxed">
              Tell EduHive where you're headed. Your AI tutors will orchestrate
              your curriculum, track prerequisite dependencies, and adapt to how
              your mind works.
            </p>
          </div>

          {/* =====================================================
              LIVE TOPOLOGY
          ====================================================== */}

          <div className="mt-6 bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1]">
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#78716C] uppercase">
                LIVE TOPOLOGY DISPATCH
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] font-semibold border border-[#CDE5D5]">
                5 Agents Active
              </span>
            </div>

            <div className="py-4 flex justify-center">
              <svg viewBox="0 0 340 180" className="w-full max-w-[300px]">
                {/* Connections */}

                <line
                  x1="170"
                  y1="90"
                  x2="80"
                  y2="40"
                  stroke="#EAE5DC"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />

                <line
                  x1="170"
                  y1="90"
                  x2="260"
                  y2="40"
                  stroke="#EAE5DC"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />

                <line
                  x1="170"
                  y1="90"
                  x2="70"
                  y2="140"
                  stroke="#EAE5DC"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />

                <line
                  x1="170"
                  y1="90"
                  x2="270"
                  y2="140"
                  stroke="#EAE5DC"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />

                <line
                  x1="170"
                  y1="90"
                  x2="50"
                  y2="90"
                  stroke="#EAE5DC"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />

                {/* Central Learner Node */}

                <circle
                  cx="170"
                  cy="90"
                  r="30"
                  fill="#FDF4F0"
                  stroke="#A8421E"
                  strokeWidth="2"
                />

                <text
                  x="170"
                  y="86"
                  textAnchor="middle"
                  fill="#1C1917"
                  className="text-[9px] font-bold"
                >
                  {fullName.trim().split(" ")[0] || "Learner"}
                  's Node
                </text>

                <text
                  x="170"
                  y="98"
                  textAnchor="middle"
                  fill="#A8421E"
                  className="text-[7.5px] font-mono"
                >
                  Focus: Synthesis
                </text>

                {/* DSA */}

                <circle
                  cx="80"
                  cy="40"
                  r="14"
                  fill="#FCF4E6"
                  stroke="#C07D1C"
                  strokeWidth="1.5"
                />

                <text
                  x="80"
                  y="43"
                  textAnchor="middle"
                  fill="#C07D1C"
                  className="text-[7px] font-mono font-bold"
                >
                  @DSA
                </text>

                {/* DBMS */}

                <circle
                  cx="260"
                  cy="40"
                  r="14"
                  fill="#EEF6F8"
                  stroke="#3B7A8C"
                  strokeWidth="1.5"
                />

                <text
                  x="260"
                  y="43"
                  textAnchor="middle"
                  fill="#3B7A8C"
                  className="text-[7px] font-mono font-bold"
                >
                  @DBMS
                </text>

                {/* Maths */}

                <circle
                  cx="70"
                  cy="140"
                  r="14"
                  fill="#FDF0ED"
                  stroke="#B93826"
                  strokeWidth="1.5"
                />

                <text
                  x="70"
                  y="143"
                  textAnchor="middle"
                  fill="#B93826"
                  className="text-[7px] font-mono font-bold"
                >
                  @Maths
                </text>

                {/* AIML */}

                <circle
                  cx="270"
                  cy="140"
                  r="14"
                  fill="#FDF2EE"
                  stroke="#DF7356"
                  strokeWidth="1.5"
                />

                <text
                  x="270"
                  y="143"
                  textAnchor="middle"
                  fill="#DF7356"
                  className="text-[7px] font-mono font-bold"
                >
                  @AIML
                </text>

                {/* General */}

                <circle
                  cx="50"
                  cy="90"
                  r="12"
                  fill="#FAF7F2"
                  stroke="#8C827A"
                  strokeWidth="1.5"
                />

                <text
                  x="50"
                  y="93"
                  textAnchor="middle"
                  fill="#57534E"
                  className="text-[6.5px] font-mono"
                >
                  @Gen
                </text>
              </svg>
            </div>

            <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-[10px] font-mono text-[#78716C]">
              <span className="flex items-center gap-1 text-[#2E7D52]">
                <Check className="w-3 h-3" />
                Autonomous consensus routing
              </span>

              <span className="font-semibold text-[#1C1917]">
                98.4% Confidence
              </span>
            </div>
          </div>

          {/* =====================================================
              FEATURES
          ====================================================== */}

          <div className="mt-6 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-[#FCE8E1] text-[#A8421E] shrink-0 mt-0.5">
                <Network className="w-3.5 h-3.5" />
              </div>

              <div>
                <span className="font-semibold text-[#1C1917]">
                  Explainable routing:{" "}
                </span>

                <span className="text-[#57534E]">
                  Inspect real-time consensus telemetry behind why each
                  specialist tutor intervenes.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-[#EAF4EE] text-[#2E7D52] shrink-0 mt-0.5">
                <Cpu className="w-3.5 h-3.5" />
              </div>

              <div>
                <span className="font-semibold text-[#1C1917]">
                  Zero siloed learning:{" "}
                </span>

                <span className="text-[#57534E]">
                  Cross-disciplinary prerequisite resolution linking
                  mathematical proofs directly to code implementations.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-[#FCF4E6] text-[#C07D1C] shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5" />
              </div>

              <div>
                <span className="font-semibold text-[#1C1917]">
                  Adaptive pedagogy:{" "}
                </span>

                <span className="text-[#57534E]">
                  Dynamic scaffolding that shifts on demand from subtle Socratic
                  questions to rigorous worked derivations.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            QUOTE
        ========================================================== */}

        <div className="mt-8 p-3.5 rounded-xl bg-[#EFE7DC] border border-[#DDD5C5] text-[11px] text-[#57534E]">
          <div className="italic">
            "The first learning platform that treats academic curiosity as an
            integrated cognitive web."
          </div>

          <div className="font-mono text-[9.5px] text-[#8C827A] mt-1 text-right">
            — Faculty of Computing & Information Studies, 2025
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT COLUMN
      ========================================================== */}

      <div className="lg:w-7/12 p-8 lg:p-12 max-w-2xl mx-auto w-full">
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl font-normal text-[#1C1917] tracking-tight">
            Create your EduHive account
          </h2>

          <p className="text-xs lg:text-sm text-[#57534E] mt-1">
            Start building your personalized learning journey with synchronized
            multi-agent guidance.
          </p>
        </div>

        {/* =========================================================
            EMAIL CONFIRMATION
        ========================================================== */}

        {emailConfirmationRequired ? (
          <div className="mt-8 p-6 bg-white rounded-xl border border-[#EAE5DC] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EAF4EE] text-[#2E7D52] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-xl text-[#1C1917]">
              Check your academic email
            </h3>

            <p className="text-xs text-[#57534E] leading-relaxed max-w-md mx-auto">
              A verification link has been sent to{" "}
              <strong className="text-[#1C1917] font-mono">{email}</strong>.
              Please confirm your academic email to unlock your multi-agent
              salon.
            </p>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A8421E] text-white text-xs font-semibold shadow-xs"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* =====================================================
                GOOGLE REGISTER
            ====================================================== */}

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting || isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#1C1917] flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGoogleSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#D6D3D1] border-t-[#1C1917] rounded-full animate-spin" />

                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google Logo */}

                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />

                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />

                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />

                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>

                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* =====================================================
                DIVIDER
            ====================================================== */}

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EAE5DC]" />
              </div>

              <span className="relative px-3 bg-[#FAF7F2] text-[10px] font-mono tracking-wider text-[#8C827A] uppercase">
                OR REGISTER VIA CREDENTIALS
              </span>
            </div>

            {/* =====================================================
                ERROR
            ====================================================== */}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-[#FDF0ED] border border-[#F7CFC2] flex items-start gap-2.5 text-xs text-[#B93826]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B93826]" />

                <div className="leading-snug">{errorMessage}</div>
              </div>
            )}

            {/* =====================================================
                REGISTRATION FORM
            ====================================================== */}

            <form onSubmit={handleRegister} className="space-y-6">
              {/* ===================================================
                  STEP 1
              ==================================================== */}

              <div className="p-4 bg-white rounded-xl border border-[#EAE5DC] space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                    1
                  </span>

                  <span className="text-xs font-semibold text-[#1C1917]">
                    Account Credentials
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
                      FULL NAME
                    </label>

                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your Full Name"
                      disabled={isSubmitting || isGoogleSubmitting}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EAE5DC] rounded-lg text-xs font-sans text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#A8421E] disabled:opacity-60"
                    />
                  </div>

                  {/* Email */}

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
                      ACADEMIC / STUDENT EMAIL
                    </label>

                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your mail id"
                      disabled={isSubmitting || isGoogleSubmitting}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EAE5DC] rounded-lg text-xs font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#A8421E] disabled:opacity-60"
                    />
                  </div>

                  {/* Password */}

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
                      CREATE PASSWORD
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting || isGoogleSubmitting}
                        className="w-full px-3 py-2 pr-9 bg-[#FAF7F2] border border-[#EAE5DC] rounded-lg text-xs font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#A8421E] disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute inset-y-0 right-0 px-2.5 flex items-center text-[#8C827A] hover:text-[#1C1917]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
                      CONFIRM PASSWORD
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting || isGoogleSubmitting}
                        className="w-full px-3 py-2 pr-9 bg-[#FAF7F2] border border-[#EAE5DC] rounded-lg text-xs font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#A8421E] disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute inset-y-0 right-0 px-2.5 flex items-center text-[#8C827A] hover:text-[#1C1917]"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===================================================
                  STEP 2
              ==================================================== */}

              <div className="p-4 bg-white rounded-xl border border-[#EAE5DC] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                      2
                    </span>

                    <span className="text-xs font-semibold text-[#1C1917]">
                      What are you preparing for?
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#A8421E]">
                    Sets Agent Telemetry
                  </span>
                </div>

                <p className="text-[11px] text-[#57534E]">
                  Select one or more trajectories to help the synthesis engine
                  calculate milestone velocity.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    {
                      id: "swe",
                      label: "< > Software Eng",
                    },
                    {
                      id: "ds",
                      label: "📈 Data Science",
                    },
                    {
                      id: "aiml",
                      label: "🤖 AI / ML",
                    },
                    {
                      id: "placement",
                      label: "🎯 Placement Preparation (Active Target)",
                    },
                    {
                      id: "other",
                      label: "✨ Other Goal",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleTrajectory(opt.id)}
                      disabled={isSubmitting || isGoogleSubmitting}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                        targetTrajectories.includes(opt.id)
                          ? "bg-[#A8421E] text-white border-[#A8421E] font-semibold shadow-xs"
                          : "bg-[#FAF7F2] hover:bg-[#F2ECE0] text-[#57534E] border-[#EAE5DC]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ===================================================
                  STEP 3
              ==================================================== */}

              <div className="p-4 bg-white rounded-xl border border-[#EAE5DC] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                      3
                    </span>

                    <span className="text-xs font-semibold text-[#1C1917]">
                      What do you want to focus on first?
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#78716C]">
                    Dynamic Multi-Select
                  </span>
                </div>

                <p className="text-[11px] text-[#57534E]">
                  Tutors marked active will immediately assemble your
                  prerequisite diagnostic tree.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    {
                      id: "dsa",
                      label: "DSA Tutor",
                      activeBg: "bg-[#A8421E] text-white border-[#A8421E]",
                    },
                    {
                      id: "dbms",
                      label: "DBMS Tutor",
                      activeBg: "bg-[#2E7D52] text-white border-[#2E7D52]",
                    },
                    {
                      id: "maths",
                      label: "Maths Tutor",
                      activeBg: "bg-[#C07D1C] text-white border-[#C07D1C]",
                    },
                    {
                      id: "aiml",
                      label: "AIML Tutor",
                      activeBg: "bg-[#DF7356] text-white border-[#DF7356]",
                    },
                    {
                      id: "general",
                      label: "General Strategy",
                      activeBg: "bg-[#57534E] text-white border-[#57534E]",
                    },
                  ].map((agent) => {
                    const isSelected = activeAgents.includes(agent.id);

                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => toggleAgent(agent.id)}
                        disabled={isSubmitting || isGoogleSubmitting}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? agent.activeBg
                            : "bg-[#FAF7F2] text-[#8C827A] border-[#EAE5DC] hover:text-[#1C1917]"
                        }`}
                      >
                        <span>● {agent.label}</span>

                        <span className="font-mono text-[10px]">
                          {isSelected ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ===================================================
                  CONSENT
              ==================================================== */}

              <div className="flex items-start gap-2 pt-1">
                <input
                  id="academic-consent"
                  type="checkbox"
                  required
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="mt-0.5 w-4 h-4 rounded border-[#D1CCC5] text-[#A8421E] focus:ring-[#A8421E]"
                />

                <label
                  htmlFor="academic-consent"
                  className="text-xs text-[#57534E] leading-relaxed select-none cursor-pointer"
                >
                  I commit to honest intellectual exploration in this salon. I
                  agree to EduHive's Terms of Academics and Autonomous Learning
                  Protocols.
                </label>
              </div>

              {/* ===================================================
                  CREATE ACCOUNT
              ==================================================== */}

              <button
                type="submit"
                disabled={isSubmitting || isGoogleSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] disabled:opacity-75 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                    <span>Creating Learning Space...</span>
                  </>
                ) : (
                  <>
                    <span>Create my learning space</span>

                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* =========================================================
            EXISTING ACCOUNT
        ========================================================== */}

        <div className="text-center mt-5 text-xs text-[#57534E]">
          <span>Already have an account? </span>

          <Link
            to="/login"
            className="font-semibold text-[#A8421E] hover:underline"
          >
            Sign in →
          </Link>
        </div>

        {/* =========================================================
            PRIVACY
        ========================================================== */}

        <div className="mt-6 pt-4 border-t border-[#EAE5DC] flex items-center justify-center gap-2 text-[11px] font-mono text-[#8C827A] text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D52] shrink-0" />

          <span>
            Your learning profile helps EduHive personalize your learning
            experience. No data is sold to third parties.
          </span>
        </div>
      </div>
    </div>
  );
}
