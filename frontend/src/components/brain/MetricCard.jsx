import React from 'react';
import { Compass, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export default function MetricCard({ type, data }) {
  if (type === 'mastery') {
    const percentage = data.overallMastery;
    const strokeDashoffset = 283 - (283 * percentage) / 100;

    return (
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            GLOBAL STATE
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FCF4E6] text-[#C07D1C] font-medium border border-[#F3E2C4]">
            LEARNING
          </span>
        </div>

        <div className="flex items-center gap-4 my-3">
          {/* Radial progress circle */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#EAE5DC"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#A8421E"
                strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * percentage) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold font-mono text-[#1C1917]">{percentage}%</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#1C1917] leading-tight">
              Overall Mastery
            </span>
            <span className="text-[11px] font-mono text-[#8C827A] mt-0.5">
              BKT confidence weight: {data.bktWeight}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#57534E] border-t border-[#F0ECE1] pt-2 flex items-center justify-between font-mono">
          <span>{data.nodesUnlocked} of {data.totalNodes} nodes unlocked</span>
          <span className="text-[#2E7D52] font-semibold">69.2%</span>
        </div>
      </div>
    );
  }

  if (type === 'cognitive') {
    return (
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            COGNITIVE LOAD
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] font-medium border border-[#CDE5D5]">
            CLI INDEX {data.cognitiveLoad.cliIndex}
          </span>
        </div>

        <div className="my-3">
          <div className="text-lg font-semibold text-[#1C1917] tracking-tight">
            {data.cognitiveLoad.zone}
          </div>
          {/* Segmented bar indicator */}
          <div className="flex gap-1.5 mt-2.5">
            {data.cognitiveLoad.segments.map((seg, idx) => (
              <div 
                key={idx} 
                className={`h-2 flex-1 rounded-full ${
                  seg === 1 
                    ? 'bg-[#2E7D52]' 
                    : seg > 0 
                      ? 'bg-[#C07D1C]' 
                      : 'bg-[#EAE5DC]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-[11px] text-[#78716C] border-t border-[#F0ECE1] pt-2 leading-tight">
          {data.cognitiveLoad.description}
        </div>
      </div>
    );
  }

  if (type === 'retention') {
    return (
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            RETENTION HALF-LIFE
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4EFE6] text-[#78716C] border border-[#DDD5C5]">
            Ebbinghaus Curve
          </span>
        </div>

        <div className="flex items-center justify-between my-3">
          <div>
            <div className="text-xl font-bold font-mono text-[#1C1917]">
              {data.retention.halfLifeDays} Days
            </div>
            <div className="text-[11px] text-[#8C827A] mt-0.5">
              Mean stability factor
            </div>
          </div>

          {/* Mini Ebbinghaus curve sparkline SVG */}
          <div className="w-20 h-9">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <path
                d="M 0,5 Q 30,8 60,25 T 100,32"
                fill="none"
                stroke="#A8421E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="32" r="3" fill="#A8421E" />
            </svg>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#57534E] border-t border-[#F0ECE1] pt-2 flex items-center justify-between">
          <span>Micro-retrieval</span>
          <span className="font-semibold text-[#A8421E]">in {data.retention.microRetrievalHours} hrs</span>
        </div>
      </div>
    );
  }

  if (type === 'strategy') {
    return (
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            ACTIVE TEACHING STRATEGY
          </span>
          <Compass className="w-4 h-4 text-[#A8421E]" />
        </div>

        <div className="my-2.5">
          <div className="text-sm font-semibold text-[#1C1917] leading-snug">
            {data.teachingStrategy.primary}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F5EE] text-[#57534E] border border-[#E7E2D7]">
              {data.teachingStrategy.scaffoldingLevel}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F5EE] text-[#57534E] border border-[#E7E2D7]">
              {data.teachingStrategy.codingLevel}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#78716C] border-t border-[#F0ECE1] pt-2 font-mono flex items-center justify-between">
          <span>Active Tutor:</span>
          <span className="text-[#A8421E] font-medium">Maths + AIML Mesh</span>
        </div>
      </div>
    );
  }

  return null;
}
