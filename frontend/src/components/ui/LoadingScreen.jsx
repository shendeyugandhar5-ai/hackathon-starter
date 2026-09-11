import React from 'react';
import EduLogo from './EduLogo';

export default function LoadingScreen({ message = 'Synchronizing Cognitive Mesh...' }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 selection:bg-[#FCE8E1] selection:text-[#A8421E]">
      <div className="flex flex-col items-center text-center space-y-4 max-w-sm">
        {/* Animated EduHive Logo */}
        <div className="relative">
          <EduLogo variant="light" size="lg" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#A8421E]/30 rounded-full blur-xs animate-pulse" />
        </div>

        {/* Loading Spinner & Status Text */}
        <div className="flex items-center gap-2 pt-2 text-xs font-mono text-[#57534E]">
          <span className="w-2 h-2 rounded-full bg-[#A8421E] animate-ping" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
