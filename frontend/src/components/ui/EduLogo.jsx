import React from 'react';

export default function EduLogo({ variant = 'dark', showSub = false, size = 'md' }) {
  // variant: 'dark' (for dark sidebar) | 'light' (for light canvas / auth / landing)
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Exact EduHive 3D Honeycomb-Book Emblem */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg 
          viewBox="0 0 120 120" 
          className={size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Hexagon (Terracotta) */}
          <path d="M60 10 L85 24 L85 52 L60 66 L35 52 L35 24 Z" fill="#D35400" />
          <path d="M60 10 L85 24 L60 38 L35 24 Z" fill="#E67E22" />
          
          {/* Top Node Indicator */}
          <circle cx="60" cy="24" r="5.5" fill="#FFFFFF" />
          <circle cx="60" cy="24" r="3.5" fill="#D35400" />
          
          {/* Circuit Line */}
          <path d="M60 29 L38 52" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

          {/* Left Hexagon (Dark Slate / Charcoal) */}
          <path d="M35 50 L60 64 L60 92 L35 106 L10 92 L10 64 Z" fill="#201E1C" />
          <path d="M35 50 L60 64 L35 78 L10 64 Z" fill="#33302C" />
          
          {/* Left Node Indicator */}
          <circle cx="35" cy="64" r="5" fill="#FFFFFF" />
          <circle cx="35" cy="64" r="3" fill="#E67E22" />

          {/* Spreading Open Book Pages Below */}
          <path d="M35 75 C45 68 60 70 85 62 L85 67 C60 75 45 73 35 80 Z" fill="#E59866" />
          <path d="M35 80 C45 74 60 76 90 70 L90 75 C60 81 45 79 35 85 Z" fill="#F39C12" />
          <path d="M35 85 C45 80 60 82 95 78 L95 83 C60 87 45 85 35 90 Z" fill="#F8C471" />

          {/* Base Node */}
          <circle cx="35" cy="85" r="4.5" fill="#FFFFFF" />
          <circle cx="35" cy="85" r="2.8" fill="#D35400" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-sans tracking-tight font-extrabold ${isDark ? 'text-white' : 'text-[#1C1917]'} ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>
            Edu<span className="text-[#C85A32]">Hive</span>
          </span>
          {showSub && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 uppercase tracking-wider">
              v2.4
            </span>
          )}
        </div>
        <span className={`text-[8px] font-mono tracking-widest uppercase mt-0.5 font-medium ${isDark ? 'text-[#8E8880]' : 'text-[#57534E]'}`}>
          AI TUTORS. BRIGHTER LEARNERS.
        </span>
      </div>
    </div>
  );
}
