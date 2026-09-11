import React from 'react';
import { Menu, Bell, Sliders, Download, Sparkles } from 'lucide-react';
import { studentProfile } from '../../data/mockData';

export default function TopBar({ onMenuClick, rightActions, breadcrumbCustom }) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-[#FAF7F2]/95 backdrop-blur-xs border-b border-[#E7E2D7] px-4 md:px-8 flex items-center justify-between">
      {/* Left Context / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md hover:bg-[#EAE5DC] text-[#57534E] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {breadcrumbCustom ? (
          breadcrumbCustom
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[#1C1917]">
              <span className="w-2 h-2 rounded-full bg-[#A8421E]"></span>
              {studentProfile.track}
            </span>
            <span className="text-[#8C827A]">/</span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5]">
              {studentProfile.subTrack}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-3">
        {/* Sync & Mesh Telemetry */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EAE5DA]/80 border border-[#DDD5C5] text-[11px] font-mono text-[#57534E]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52] animate-pulse"></span>
          <span>Mesh: {studentProfile.syncRate} Sync • {studentProfile.latency}</span>
        </div>

        {rightActions ? (
          rightActions
        ) : (
          <div className="flex items-center gap-2">
            <button 
              title="Notifications"
              className="p-1.5 rounded-full hover:bg-[#EAE5DC] text-[#57534E] transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#A8421E]"></span>
            </button>
            <div 
              title={studentProfile.name}
              className="w-7 h-7 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-[10px] font-mono font-semibold ring-2 ring-[#EAE5DC] cursor-pointer"
            >
              {studentProfile.initials}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
