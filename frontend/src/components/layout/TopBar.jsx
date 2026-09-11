import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { studentProfile } from '../../data/mockData';

export default function TopBar({
  onMenuClick,
  rightActions,
  breadcrumbCustom,
}) {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const displayName =
    profile?.name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    "Learner";

  const displayEmail =
    profile?.academic_email ||
    profile?.email ||
    user?.email ||
    "student@university.edu";

  const displayInitials = profile?.initials || "EH";

  const displayGoal = profile?.goal || "Learning";

  // Convert stored track/goal names into clean display names
  const formatTrackName = (track) => {
    if (!track) return "Learning";

    const normalized = track
      .trim()
      .toLowerCase()
      .replace(/\s*track\s*$/i, "");

    const trackMap = {
      "ds, aiml": "DS + AI/ML",
      "ds aiml": "DS + AI/ML",
      "ds+aiml": "DS + AI/ML",

      dsa: "DSA",
      dbms: "DBMS",
      aiml: "AI/ML",

      mathematics: "Mathematics",
      math: "Mathematics",
    };

    if (trackMap[normalized]) {
      return trackMap[normalized];
    }

    // Generic fallback for other track names
    return normalized
      .split(/\s+/)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  const displayTrack = formatTrackName(
    profile?.track || displayGoal
  );

  const displaySubTrack =
    profile?.subTrack || "Personalized Learning";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#FAF7F2]/95 backdrop-blur-xs border-b border-[#E7E2D7] px-4 md:px-8 flex items-center justify-between">
      {/* Left Context / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md hover:bg-[#EAE5DC] text-[#57534E] lg:hidden cursor-pointer"
          aria-label={t('common.openNav')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {breadcrumbCustom ? (
          breadcrumbCustom
        ) : (
          <div className="flex items-center gap-2 text-xs">
            {/* Track */}
            <span className="flex items-center gap-1.5 font-medium text-[#1C1917]">
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute w-2 h-2 rounded-full bg-[#A8421E]/20" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-[#A8421E]" />
              </span>

              <span className="font-mono text-[11px] font-semibold tracking-[0.01em]">
                {displayTrack}
              </span>
            </span>

            {/* Separator */}
            <span className="text-[#8C827A]">/</span>

            {/* Learning mode */}
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5]">
              {displaySubTrack}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-3">
        {/* Sync & Mesh Telemetry */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EAE5DA]/80 border border-[#DDD5C5] text-[11px] font-mono text-[#57534E]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52] animate-pulse"></span>
          <span>Mesh: Live • backend connected</span>
        </div>

        {rightActions ? (
          rightActions
        ) : (
          <div className="flex items-center gap-2" ref={dropdownRef}>
            <LanguageSwitcher />

            <button 
              title={t('common.notifications')}
              className="p-1.5 rounded-full hover:bg-[#EAE5DC] text-[#57534E] transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />

              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#A8421E]"></span>
            </button>

            {/* User Avatar & Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowDropdown(!showDropdown)
                }
                title={displayName}
                className="w-7 h-7 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-[10px] font-mono font-semibold ring-2 ring-[#EAE5DC] hover:ring-[#A8421E]/30 transition-all cursor-pointer"
              >
                {displayInitials}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#EAE5DC] shadow-lg py-1.5 z-50 animate-fade-in text-xs">
                  <div className="px-3.5 py-2.5 border-b border-[#F0ECE1]">
                    <div className="font-semibold text-[#1C1917] truncate">
                      {displayName}
                    </div>

                    <div className="text-[11px] font-mono text-[#8C827A] truncate mt-0.5">
                      {displayEmail}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/app/profile"
                      onClick={() =>
                        setShowDropdown(false)
                      }
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[#57534E] hover:bg-[#FAF7F2] hover:text-[#1C1917] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#A8421E]" />
                      <span>{t('common.studentProfile')}</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-[#F0ECE1]">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#B93826] hover:bg-[#FDF0ED] transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-[#B93826]" />
                      <span>{t('common.signOut')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}