import React from 'react';
import { Code2, Database, Sigma, Sparkles } from 'lucide-react';

const iconMap = {
  Code2: Code2,
  Database: Database,
  Sigma: Sigma,
  Sparkles: Sparkles,
  dsa: Code2,
  dbms: Database,
  maths: Sigma,
  aiml: Sparkles
};

export default function CurricularFacetCard({ facet }) {
  if (!facet) return null;

  const Icon = iconMap[facet.icon] || iconMap[facet.id] || Code2;
  const isWeak = facet.status === 'WEAK';
  const topStrength = facet.topStrength || {};
  const activeFocus = facet.activeFocus || {};

  return (
    <div className={`bg-white rounded-xl p-5 border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden transition-all duration-150 hover:border-[#D4CCBE] ${
      facet.hasLeftAccent || isWeak ? 'border-l-4 border-l-[#B93826] border-[#EAE5DC]' : 'border-[#EAE5DC]'
    }`}>
      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isWeak ? 'bg-[#FDF0ED] text-[#B93826]' : 'bg-[#F8F5EE] text-[#A8421E]'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#1C1917]">
                {facet.discipline || facet.id?.toUpperCase() || 'Discipline'}
              </h3>
              <span className="text-[11px] font-mono text-[#8C827A]">
                {facet.conceptCount ?? 0} concept nodes active
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold font-mono text-[#1C1917]">
              {facet.mastery ?? 0}%
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase ${
              isWeak 
                ? 'bg-[#FDF0ED] text-[#B93826]' 
                : 'bg-[#FCF4E6] text-[#C07D1C]'
            }`}>
              {facet.status || (isWeak ? 'WEAK' : 'LEARNING')}
            </span>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="w-full bg-[#EAE5DC] h-1.5 rounded-full mt-3.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              isWeak ? 'bg-[#B93826]' : 'bg-[#C07D1C]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, facet.mastery ?? 0))}%` }}
          />
        </div>
      </div>

      {/* Strength & Focus Dual Box */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#F0ECE1]">
        {/* Left Box: Top Strength or Top Weakness */}
        <div className={`p-2.5 rounded-lg border ${
          topStrength.isWeak 
            ? 'bg-[#FDF0ED]/60 border-[#F7CFC2]' 
            : 'bg-[#FAF7F2] border-[#EAE5DC]'
        }`}>
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            {topStrength.isWeak ? 'TOP WEAKNESS' : 'TOP STRENGTH'}
          </div>
          <div className="text-xs font-semibold text-[#1C1917] mt-0.5 truncate">
            {topStrength.title || '—'}
          </div>
          <div className={`text-[10px] font-mono mt-1 ${
            topStrength.isWeak ? 'text-[#B93826] font-semibold' : 'text-[#2E7D52]'
          }`}>
            {topStrength.badge || topStrength.detail || `${topStrength.score ?? facet.mastery ?? 0}%`}
          </div>
        </div>

        {/* Right Box: Active Focus or Active Gap */}
        <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#EAE5DC]">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            {activeFocus.isGap ? 'ACTIVE GAP' : 'ACTIVE FOCUS'}
          </div>
          <div className="text-xs font-semibold text-[#1C1917] mt-0.5 truncate">
            {activeFocus.title || 'Target Remediation'}
          </div>
          <div className="text-[10px] font-mono text-[#78716C] mt-1 truncate">
            {activeFocus.detail || 'Active Frontier'}
          </div>
        </div>
      </div>
    </div>
  );
}
