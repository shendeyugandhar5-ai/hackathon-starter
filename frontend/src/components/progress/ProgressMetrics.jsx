import React from "react";
import {
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { studentProfile } from "../../data/mockData";

export default function ProgressMetrics({ progressData }) {
  const velocity = progressData?.velocity || studentProfile.velocity;
  const retentionRate =
    progressData?.retentionRate || studentProfile.retention.sevenDayRetention;
  const focusedHours =
    progressData?.focusedHours || studentProfile.focusedHours;
  const upcomingGate = progressData?.milestones?.find(
    (milestone) => milestone.status !== "completed",
  ) || {
    title: studentProfile.upcomingGate.title,
    week: `W${studentProfile.upcomingGate.gateNumber}`,
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Learning Velocity */}
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            Learning Velocity
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-[#2E7D52]" />
        </div>

        <div className="my-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#1C1917]">
              {velocity.rate}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] font-semibold">
              {velocity.status}
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#78716C] border-t border-[#F0ECE1] pt-2 flex items-center justify-between">
          <span>Target: {velocity.target}</span>
          <span className="font-semibold text-[#1C1917]">
            {velocity.pacePercentile}
          </span>
        </div>
      </div>

      {/* 2. 7-Day Memory Retention */}
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            7-Day Memory Retention
          </span>
          <span className="text-xs">🧠</span>
        </div>

        <div className="my-2.5">
          <div className="text-2xl font-bold font-mono text-[#1C1917]">
            {retentionRate}
          </div>
          <div className="w-full bg-[#EAE5DC] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#2E7D52] h-full rounded-full"
              style={{ width: retentionRate }}
            />
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#78716C] border-t border-[#F0ECE1] pt-2">
          {studentProfile.retention.scaleName}
        </div>
      </div>

      {/* 3. Focused Hours Logged */}
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            Focused Hours Logged
          </span>
          <Clock className="w-3.5 h-3.5 text-[#C07D1C]" />
        </div>

        <div className="my-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#1C1917]">
              {focusedHours.total}{" "}
              <span className="text-sm font-normal">hrs</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] font-semibold">
              {focusedHours.recentDelta}
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#78716C] border-t border-[#F0ECE1] pt-2">
          {focusedHours.scope}
        </div>
      </div>

      {/* 4. Upcoming Gate 2 */}
      <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
            Upcoming {upcomingGate.week || "Gate"}
          </span>
          <Calendar className="w-3.5 h-3.5 text-[#A8421E]" />
        </div>

        <div className="my-2.5">
          <div className="text-2xl font-bold font-mono text-[#A8421E]">
            <span className="text-lg">In progress</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#57534E] border-t border-[#F0ECE1] pt-2 truncate">
          {upcomingGate.title}
        </div>
      </div>
    </div>
  );
}
