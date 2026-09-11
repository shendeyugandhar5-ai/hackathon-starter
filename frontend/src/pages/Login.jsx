import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import EduLogo from '../components/ui/EduLogo';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('rahul.sharma@university.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to requested destination or /app/tutor
  const destination = location.state?.from?.pathname || '/app/tutor';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, destination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your academic credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col md:flex-row">
      {/* Left Column: Editorial Brand Showcase (50% width on desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#F5EFEB] via-[#EFE7DE] to-[#E8DDD0] p-12 lg:p-16 flex-col justify-between border-r border-[#E2DAD0] relative overflow-hidden">
        {/* Subtle ambient background aura */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#A8421E]/8 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top Tag */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAE2D5] text-[#57534E] font-mono text-[11px] font-semibold tracking-wider uppercase border border-[#DDD5C5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8421E]"></span>
            COORDINATED TUTOR NETWORK
          </div>
        </div>

        {/* Big Editorial Quote */}
        <div className="my-auto max-w-lg z-10">
          <h1 className="font-serif text-4xl lg:text-5xl font-normal text-[#1C1917] tracking-tight leading-[1.12]">
            Welcome back to your hive.
          </h1>
          <p className="mt-5 text-sm lg:text-base text-[#57534E] leading-relaxed">
            Your tutors remember where you left off. Every question, misconception, and mastery score is synchronized across your specialist AI team.
          </p>
        </div>

        {/* Left Bottom Metadata */}
        <div className="font-mono text-[11px] text-[#8C827A] flex items-center justify-between z-10">
          <span>EduHive Cognitive Architecture</span>
          <span>v2.4 Study Salon</span>
        </div>
      </div>

      {/* Right Column: Authentication Card Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        {/* Top Header with Logo & Salon Badge */}
        <div className="flex items-center justify-between pb-6">
          <Link to="/">
            <EduLogo variant="light" size="md" />
          </Link>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5] tracking-wider uppercase">
            V2.4 STUDY SALON
          </span>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#1C1917] tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs md:text-sm text-[#57534E] mt-1">
              Continue your synchronized learning journey.
            </p>
          </div>

          {/* Inline Error Display */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-[#FDF0ED] border border-[#F7CFC2] flex items-start gap-2.5 text-xs text-[#B93826]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B93826]" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Academic Email Input */}
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5 font-sans">
                Academic Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C827A]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE5DC] rounded-lg text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#A8421E]/30 focus:border-[#A8421E] transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1C1917] font-sans">
                  Password
                </label>
                <span className="text-xs font-semibold text-[#A8421E] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C827A]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#EAE5DC] rounded-lg text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#A8421E]/30 focus:border-[#A8421E] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C827A] hover:text-[#1C1917]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#D1CCC5] text-[#A8421E] focus:ring-[#A8421E]"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-[#57534E] select-none cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] disabled:opacity-75 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign in to EduHive</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EAE5DC]"></div>
            </div>
            <span className="relative px-3 bg-[#FAF7F2] text-[10px] font-mono tracking-wider text-[#8C827A] uppercase">
              OR CONTINUE WITH
            </span>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={() => handleSubmit({ preventDefault: () => {} })}
            className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#1C1917] flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer"
          >
            {/* Google Logo SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* New Account Link */}
          <div className="text-center mt-6 text-xs text-[#57534E]">
            <span>New to EduHive? </span>
            <Link to="/register" className="font-semibold text-[#A8421E] hover:underline">
              Create an account →
            </Link>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="pt-6 border-t border-[#EAE5DC] flex items-center justify-center gap-2 text-[11px] font-mono text-[#8C827A]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D52]" />
          <span>Protected with end-to-end encrypted student context.</span>
        </div>
      </div>
    </div>
  );
}
