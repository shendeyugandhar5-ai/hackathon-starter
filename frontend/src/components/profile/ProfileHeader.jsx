import React from 'react';
import { Mail, CheckCircle2, Clock, Sparkles, ShieldCheck } from 'lucide-react';

export default function ProfileHeader({ profile, user }) {
  const displayName = profile?.name || profile?.full_name || user?.user_metadata?.full_name || 'EduHive Student';
  const displayEmail = profile?.academic_email || profile?.email || user?.email || 'student@university.edu';
  const displayGoal = profile?.goal || 'Placement Preparation';
  const displayInitials = profile?.initials || 'EH';
  const isOnboardingComplete = Boolean(profile?.onboarding_completed);

  return (
    <div className="bg-white rounded-xl border border-[#EAE5DC] p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Avatar & Primary Identity */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#A8421E] text-white flex items-center justify-center font-mono text-xl sm:text-2xl font-bold ring-4 ring-[#F0ECE1] shadow-xs shrink-0 select-none">
            {displayInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1C1917] tracking-tight">
                {displayName}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FDF2EE] text-[#A8421E] border border-[#FADCD1] font-mono text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                {displayGoal}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#57534E] border border-[#EAE5DC] font-mono text-xs">
                <Mail className="w-3 h-3 text-[#8C827A]" />
                {displayEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Learning Space Status Badge */}
        <div className="flex flex-col items-start sm:items-end">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
            LEARNING SPACE
          </span>
          {isOnboardingComplete ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAF4EE] text-[#2E7D52] border border-[#CDE5D5] font-mono text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D52]" />
              <span>✓ Setup complete</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FCF4E6] text-[#C07D1C] border border-[#F2D8B3] font-mono text-xs font-semibold shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#C07D1C]" />
              <span>Setup incomplete</span>
            </div>
          )}
          <span className="text-[10px] text-[#8C827A] font-mono mt-1">
            Status managed automatically
          </span>
        </div>
      </div>
    </div>
  );
}
