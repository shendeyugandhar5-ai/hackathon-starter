import React from "react";
import {
  Briefcase,
  CheckCircle,
  AlertCircle,
  Lock,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import {
  curricularFacets,
  placementBenchmarks,
  atsResumeMatch,
  mentorData,
} from "../../data/mockData";

export default function PlacementBenchmark({ progressData }) {
  const liveFacets = progressData?.subjects?.length
    ? progressData.subjects.map((subject) => ({
        id: subject.subject,
        discipline: subject.subject.toUpperCase(),
        mastery: Math.round(subject.average_score * 100),
        activeFocus: { title: subject.weak_topics?.[0] || "Steady progress" },
        status: subject.average_score < 0.5 ? "WEAK" : "LEARNING",
      }))
    : curricularFacets;
  return (
    <div className="space-y-4">
      {/* 1. Curricular Mastery Facets Summary */}
      <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="font-semibold text-sm text-[#1C1917]">
          Curricular Mastery Facets
        </h3>
        <p className="text-[11px] text-[#78716C] mt-0.5">
          Continuously calibrated across 4 core domains
        </p>

        <div className="mt-4 space-y-3">
          {liveFacets.map((facet) => {
            const isWeak = facet.status === "WEAK";
            return (
              <div key={facet.id} className="text-xs">
                <div className="flex items-center justify-between font-medium text-[#1C1917]">
                  <span>{facet.discipline}</span>
                  <span className="font-mono font-bold">{facet.mastery}%</span>
                </div>
                <div className="w-full bg-[#EAE5DC] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWeak ? "bg-[#B93826]" : "bg-[#2E7D52]"}`}
                    style={{ width: `${facet.mastery}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8C827A] mt-1">
                  <span>Focus: {facet.activeFocus.title}</span>
                  {isWeak && (
                    <span className="text-[#B93826] font-semibold">
                      Active Blocker: Cond. Prob
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Placement Benchmark Card */}
      <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1]">
          <div>
            <h3 className="font-semibold text-sm text-[#1C1917]">
              Placement Benchmark
            </h3>
            <p className="text-[11px] text-[#78716C]">
              Predicted evaluation match against verified interview rubrics
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#A8421E] font-semibold border border-[#E7E2D7]">
            Tier-1 Target
          </span>
        </div>

        {/* Company match items */}
        <div className="mt-3 space-y-2.5">
          {placementBenchmarks.map((bench) => (
            <div
              key={bench.company}
              className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-[#1C1917]">
                  {bench.company}{" "}
                  <span className="font-normal text-[#57534E]">
                    • {bench.role}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#8C827A] mt-0.5">
                  {bench.tags}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] border border-[#CDE5D5]">
                  {bench.fitPercentage}% Fit
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ATS Resume Match Keywords */}
        <div className="mt-3.5 pt-3 border-t border-[#F0ECE1]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-2">
            ATS RESUME MATCH ({atsResumeMatch.score}%)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {atsResumeMatch.keywords.map((kw) => (
              <span
                key={kw.name}
                className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border ${
                  kw.matched
                    ? "bg-[#EAF4EE] text-[#2E7D52] border-[#CDE5D5]"
                    : kw.warning
                      ? "bg-[#FDF0ED] text-[#B93826] border-[#F7CFC2]"
                      : "bg-[#F8F5EE] text-[#8C827A] border-[#E7E2D7]"
                }`}
              >
                {kw.matched && <CheckCircle className="w-2.5 h-2.5" />}
                {kw.warning && <AlertCircle className="w-2.5 h-2.5" />}
                {kw.locked && <Lock className="w-2.5 h-2.5" />}
                {kw.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Mentor 1:1 Card */}
      <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-xs font-mono font-bold">
            {mentorData.initials}
          </div>
          <div>
            <div className="text-xs font-semibold text-[#1C1917]">
              {mentorData.name}
            </div>
            <div className="text-[10px] text-[#78716C]">{mentorData.title}</div>
          </div>
        </div>

        <button className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0EBE0] text-[#1C1917] border border-[#DDD5C5] text-xs font-mono font-medium transition-colors">
          {mentorData.action}
        </button>
      </div>
    </div>
  );
}
