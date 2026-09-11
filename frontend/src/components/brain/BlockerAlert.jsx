import React from 'react';
import { AlertTriangle, ArrowRight, Play, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlockerAlert({ data }) {
  if (!data || !data.detected) return null;

  return (
    <div className="bg-[#FDF4F0] border border-[#F5C7B8] rounded-xl p-5 md:p-6 shadow-[0_2px_12px_rgba(168,66,30,0.06)] relative overflow-hidden">
      {/* Top Tag & Priority Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FCE8E1] text-[#B93826] font-mono text-[10px] font-semibold tracking-wide border border-[#F7CFC2]">
            <AlertTriangle className="w-3 h-3 text-[#B93826]" />
            PREREQUISITE BLOCKER DETECTED • {data.agent}
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#A8421E] font-medium">
          Intervention Priority: {data.priority}
        </span>
      </div>

      {/* Main Title & Description */}
      <div className="max-w-4xl">
        <h2 className="font-serif text-xl md:text-2xl font-normal text-[#1C1917] tracking-tight leading-snug">
          {data.title}
        </h2>
        <p className="mt-2 text-xs md:text-sm text-[#57534E] leading-relaxed">
          {data.description}
        </p>
      </div>

      {/* Visual Prerequisite Lineage Block */}
      <div className="my-5 p-4 bg-white/80 rounded-xl border border-[#F2D7CD] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Source Blocker Node */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-9 h-9 rounded-lg bg-[#FDF0ED] border border-[#F7CFC2] flex items-center justify-center shrink-0">
            <span className="text-xs font-mono font-bold text-[#B93826]">!</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold text-[#B93826] bg-[#FDF0ED] px-1.5 py-0.5 rounded border border-[#F7CFC2]">
                {data.sourceNode.score}% {data.sourceNode.state}
              </span>
              <span className="text-[10px] font-mono text-[#8C827A]">
                {data.sourceNode.category} {data.sourceNode.id}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#1C1917] mt-0.5">
              {data.sourceNode.title}
            </div>
            <div className="text-[11px] text-[#78716C]">
              {data.sourceNode.subtitle}
            </div>
          </div>
        </div>

        {/* Blocking Connection Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono font-semibold text-[#A8421E] tracking-wider uppercase px-3 py-1 rounded bg-[#FDF4F0] border border-[#F5C7B8] shrink-0">
          <span>BLOCKS CONCEPT</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>

        {/* Target Milestone Node */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-9 h-9 rounded-lg bg-[#FCF4E6] border border-[#F3E2C4] flex items-center justify-center shrink-0">
            <span className="text-xs font-mono font-bold text-[#C07D1C]">✦</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold text-[#C07D1C] bg-[#FCF4E6] px-1.5 py-0.5 rounded border border-[#F3E2C4]">
                {data.targetNode.score}% {data.targetNode.state}
              </span>
              <span className="text-[10px] font-mono text-[#8C827A]">
                {data.targetNode.category} {data.targetNode.id}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#1C1917] mt-0.5">
              {data.targetNode.title}
            </div>
            <div className="text-[11px] text-[#78716C]">
              {data.targetNode.subtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Action Triggers Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/app/tutor?mode=diagnostic"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch 5-min Diagnostic Check
          </Link>
          <Link
            to="/app/tutor?agent=maths"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#57534E] hover:text-[#1C1917] border border-[#E7E2D7] text-xs font-medium transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#8C827A]" />
            Review Notes with Maths Agent
          </Link>
        </div>
        <span className="text-[11px] font-mono text-[#8C827A]">
          Est. time to resolution: {data.estResolutionTime}
        </span>
      </div>
    </div>
  );
}
