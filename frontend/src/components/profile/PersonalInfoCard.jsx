import React from 'react';
import { User, Mail, Lock } from 'lucide-react';

export default function PersonalInfoCard({ name, setName, email }) {
  return (
    <div className="bg-white rounded-xl border border-[#EAE5DC] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
        <div>
          <h2 className="font-serif text-lg font-normal text-[#1C1917]">
            Personal Information
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Your name is shared across your AI tutor salons and collaborative session transcripts.
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EAE5DC]">
          STUDENT IDENTITY
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Full Name (Editable) */}
        <div>
          <label 
            htmlFor="profile-name-input"
            className="block text-[11px] font-mono uppercase tracking-wider text-[#57534E] font-semibold mb-1.5"
          >
            FULL NAME
          </label>
          <div className="relative">
            <input
              id="profile-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EAE5DC] rounded-lg text-xs font-sans text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#A8421E] focus:bg-white transition-all shadow-2xs"
            />
            <div className="absolute right-3 top-2.5 text-[#8C827A]">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-[#8C827A] mt-1">
            Displayed on your Student Brain node and tutor dialogs.
          </p>
        </div>

        {/* Academic Email (Read-Only) */}
        <div>
          <label 
            htmlFor="profile-email-input"
            className="block text-[11px] font-mono uppercase tracking-wider text-[#57534E] font-semibold mb-1.5 flex items-center justify-between"
          >
            <span>ACADEMIC EMAIL</span>
            <span className="text-[10px] font-mono text-[#8C827A] normal-case flex items-center gap-1 font-normal">
              <Lock className="w-3 h-3" /> Read-only
            </span>
          </label>
          <div className="relative">
            <input
              id="profile-email-input"
              type="email"
              disabled
              value={email || ''}
              className="w-full px-3.5 py-2.5 bg-[#F5EFEB] border border-[#E2DAD0] rounded-lg text-xs font-mono text-[#78716C] cursor-not-allowed select-none shadow-2xs"
            />
            <div className="absolute right-3 top-2.5 text-[#8C827A]">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-[#8C827A] mt-1">
            Linked to your authenticated Supabase identity.
          </p>
        </div>
      </div>
    </div>
  );
}
