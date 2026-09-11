import { useTranslation } from '../i18n';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Check, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  UserX, 
  ArrowRight, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import PersonalInfoCard from '../components/profile/PersonalInfoCard';
import LearningPreferences from '../components/profile/LearningPreferences';
import AccountActions from '../components/profile/AccountActions';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateStudentProfile, signOut, fetchProfile } = useAuth();

  // Local editable form states
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Placement Preparation');
  const [focusTutors, setFocusTutors] = useState(['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor']);
  
  // UI Status states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync form state when profile or user changes
  useEffect(() => {
    if (profile) {
      setName(profile.name || profile.full_name || '');
      setGoal(profile.goal || 'Placement Preparation');
      setFocusTutors(
        Array.isArray(profile.focus_tutors) && profile.focus_tutors.length > 0
          ? profile.focus_tutors
          : ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor']
      );
      setInitialLoading(false);
    } else if (user) {
      setName(user.user_metadata?.full_name || '');
      setGoal(user.user_metadata?.goal || 'Placement Preparation');
      setFocusTutors(user.user_metadata?.active_agents || ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor']);
      setInitialLoading(false);
    }
  }, [profile, user]);

  // Check if form has unsaved modifications
  const hasChanges = 
    profile && (
      name !== (profile.name || profile.full_name || '') ||
      goal !== (profile.goal || 'Placement Preparation') ||
      JSON.stringify(focusTutors) !== JSON.stringify(profile.focus_tutors || [])
    );

  // Reset form to active profile
  const handleReset = () => {
    if (profile) {
      setName(profile.name || profile.full_name || '');
      setGoal(profile.goal || 'Placement Preparation');
      setFocusTutors(profile.focus_tutors || ['DSA Tutor', 'DBMS Tutor', 'Maths Tutor', 'AIML Tutor']);
    }
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  // Save changes to Supabase public.students table
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!name.trim()) {
      setErrorMessage('Full Name cannot be empty.');
      return;
    }

    setIsSaving(true);

    try {
      await updateStudentProfile({
        name: name.trim(),
        goal: goal.trim(),
        focus_tutors: focusTutors
      });

      setSaveSuccess(true);
      // Auto-fade success message after 4 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to update student profile:', err);
      setErrorMessage(err.message || 'Unable to save your profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (authLoading || (initialLoading && !user)) {
    return <LoadingScreen message="Loading student identity..." />;
  }

  // Handle case where user is authenticated but learning profile is missing or uninitialized
  const isUninitialized = !profile?.name && !user?.user_metadata?.full_name;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Context Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#A8421E] uppercase tracking-wider font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8421E]"></span>
            {t('profile.subtitle')}
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#1C1917] tracking-tight">
            {t('profile.title')}
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-0.5">
            {t('profile.description')}
          </p>
        </div>

        {/* Global Save Trigger in Header */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#EAE5DC] text-xs font-semibold text-[#57534E] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8C827A]" />
              <span>{t('common.discard')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
            className="px-4 py-2 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('profile.savingChanges')}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t('profile.saveChanges')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Feedback Alerts */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-[#EAF4EE] border border-[#CDE5D5] flex items-center justify-between text-xs text-[#2E7D52] shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D52] shrink-0" />
            <span>{t('profile.saved')}</span>
          </div>
          <span className="text-[10px] font-mono text-[#2E7D52] uppercase font-semibold">
            ✓ Synchronized
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FDF0ED] border border-[#F7CFC2] flex items-start gap-2.5 text-xs text-[#B93826] shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B93826]" />
          <div className="leading-snug">{errorMessage}</div>
        </div>
      )}

      {/* Profile Uninitialized Warning Card (if no student record exists) */}
      {isUninitialized && (
        <div className="p-5 rounded-xl bg-[#FCF4E6] border border-[#F2D8B3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#F9E8CD] text-[#C07D1C] shrink-0 mt-0.5">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-[#1C1917]">
                {t('profile.notInitialized')}
              </h3>
              <p className="text-xs text-[#57534E] mt-0.5">
                Set up your academic trajectory and specialist tutors below, or complete onboarding.
              </p>
            </div>
          </div>
          <Link
            to="/register"
            className="px-3.5 py-2 rounded-lg bg-[#C07D1C] hover:bg-[#A86C16] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
          >
            <span>{t('profile.completeOnboarding')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Component 1: Identity & Avatar Header */}
      <ProfileHeader profile={profile} user={user} />

      {/* Component 2: Personal Information Form */}
      <PersonalInfoCard 
        name={name} 
        setName={setName} 
        email={profile?.academic_email || profile?.email || user?.email} 
      />

      {/* Component 3: Learning Preferences & Active AI Tutors */}
      <LearningPreferences
        goal={goal}
        setGoal={setGoal}
        focusTutors={focusTutors}
        setFocusTutors={setFocusTutors}
      />

      {/* Component 4: Account Security & Sign Out */}
      <AccountActions onSignOut={handleSignOut} />

      {/* Bottom Floating Save Action Bar (shown when modified) */}
      {hasChanges && (
        <div className="sticky bottom-4 z-20 p-4 bg-[#161514] text-[#EDE9E3] rounded-xl border border-[#2E2B27] shadow-xl flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#E07A5F] animate-pulse"></span>
            <span>{t('profile.unsaved')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#C5BFB5] hover:text-white hover:bg-[#252321] transition-colors cursor-pointer"
            >
              {t('common.reset')}
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
