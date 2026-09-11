import React, { useState } from "react";
import {
  Check,
  ArrowRight,
  Play,
  Lock,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { structuredRoadmapWeeks } from "../../data/mockData";

export default function RoadmapPathway({ progressData }) {
  const [activeTab, setActiveTab] = useState("all");
  const currentWeek = progressData?.sprintPace?.currentWeek || 1;
  const milestones = progressData?.milestones || [];
  const currentMilestone =
    milestones.find((milestone) => milestone.status === "in-progress") ||
    milestones[0];
  const completedMilestones = milestones.filter(
    (milestone) => milestone.status === "completed",
  ).length;

  return (
    <div className="bg-white rounded-xl p-5 md:p-6 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Pathway Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0ECE1]">
        <div>
          <h2 className="font-serif text-xl font-normal text-[#1C1917] tracking-tight">
            8-Week Structured Pathway
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Step-by-step milestones aligned with Tier-1 Data Scientist
            expectations
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#EAE5DC] text-xs font-mono">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "all"
                ? "bg-white text-[#1C1917] shadow-xs font-semibold"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            All Sprints
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "active"
                ? "bg-white text-[#1C1917] shadow-xs font-semibold"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            Active (W{currentWeek})
          </button>
          <button
            onClick={() => setActiveTab("gates")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === "gates"
                ? "bg-white text-[#1C1917] shadow-xs font-semibold"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            Milestone Gates
          </button>
        </div>
      </div>

      {/* Structured Sprint Lineage Timeline */}
      <div className="mt-6 space-y-6 relative before:absolute before:top-3 before:bottom-3 before:left-3.5 before:w-0.5 before:bg-[#EAE5DC]">
        {/* Current progress summary */}
        <div className="relative pl-9">
          {/* Timeline Node Icon */}
          <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-[#EAF4EE] border-2 border-[#2E7D52] flex items-center justify-center text-[#2E7D52] z-10">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>

          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#EAE5DC] hover:border-[#DDD5C5] transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#2E7D52]">
                  {completedMilestones} MILESTONE
                  {completedMilestones === 1 ? "" : "S"} COMPLETED
                </span>
                <span className="text-[10px] font-mono text-[#8C827A]">
                  {progressData?.focusedHours?.total || 0} hrs logged
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] font-semibold border border-[#CDE5D5]">
                {progressData?.overallMastery || 0}% Mastered
              </span>
            </div>

            <h3 className="font-semibold text-sm text-[#1C1917] mt-1.5">
              {currentMilestone?.title ||
                "Your learning pathway is being prepared"}
            </h3>
            <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
              Progress is recalculated from your mastery, assessments, and
              selected learning goals.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-[#EAE5DC] text-[11px] font-mono text-[#57534E]">
              <span className="inline-flex items-center gap-1 text-[#2E7D52]">
                <Check className="w-3 h-3" />{" "}
                {progressData?.targetRole || "Personalized track"}
              </span>
              <span className="text-[#8C827A]">•</span>
              <span className="inline-flex items-center gap-1 text-[#2E7D52]">
                <Check className="w-3 h-3" /> Week {currentWeek} focus
              </span>
              <span className="text-[#8C827A]">•</span>
              <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#DDD5C5] text-[#1C1917] font-semibold">
                Placement Fit: {progressData?.placementFit || 0}/100
              </span>
            </div>
          </div>
        </div>

        {/* Current sprint */}
        <div className="relative pl-9">
          {/* Timeline Node Icon */}
          <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-[#FCF4E6] border-2 border-[#C07D1C] flex items-center justify-center text-[#C07D1C] z-10 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#C07D1C] animate-ping" />
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-[#C07D1C]/40 shadow-[0_2px_12px_rgba(192,125,28,0.06)] relative">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#C07D1C]">
                  WEEK {currentWeek} • CURRENT SPRINT
                </span>
                <span className="text-[10px] font-mono text-[#8C827A]">
                  {currentMilestone?.status || "in-progress"}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FCF4E6] text-[#C07D1C] font-semibold border border-[#F3E2C4]">
                {progressData?.overallMastery || 0}% In Progress
              </span>
            </div>

            <h3 className="font-semibold text-sm md:text-base text-[#1C1917] mt-1.5">
              {currentMilestone?.title || "Personalized learning sprint"}
            </h3>
            <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
              Your next milestone updates as you complete assessments and tutor
              sessions.
            </p>

            {/* Sub-breakdown blocker box */}
            <div className="mt-3.5 p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="p-1 rounded bg-[#FDF0ED] border border-[#F7CFC2] text-[#B93826]">
                  <span className="text-xs font-mono font-bold">!</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1C1917]">
                    Conditional Probability
                  </div>
                  <div className="text-[10px] font-mono text-[#B93826] font-medium">
                    42% Weak • Needs Fix
                  </div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-[#A8421E] hidden sm:block shrink-0" />

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#1C1917]">
                    Naive Bayes Classifier
                  </div>
                  <div className="text-[10px] font-mono text-[#C07D1C] font-medium">
                    58% In Progress
                  </div>
                </div>
                <div className="p-1 rounded bg-[#FCF4E6] border border-[#F3E2C4] text-[#C07D1C]">
                  <span className="text-xs font-mono font-bold">⏳</span>
                </div>
              </div>
            </div>

            {/* Footer triggers */}
            <div className="mt-3.5 pt-3 border-t border-[#F0ECE1] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-[#78716C]">
                Assigned Agents:{" "}
                <strong className="text-[#A8421E]">Maths + AIML</strong>
              </span>
              <Link
                to="/app/tutor?sprint=2"
                className="text-xs font-semibold font-mono text-[#A8421E] hover:text-[#8E3516] flex items-center gap-1 group"
              >
                <span>Launch Sprint Diagnostic</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* WEEK 03: UPCOMING */}
        <div className="relative pl-9 opacity-80 hover:opacity-100 transition-opacity">
          <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-[#FAF7F2] border-2 border-[#D1CCC5] flex items-center justify-center text-[#8C827A] z-10">
            <Lock className="w-3 h-3" />
          </div>

          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#EAE5DC]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-[#8C827A]">
                WEEK 03 • UPCOMING
              </span>
              <span className="text-[10px] font-mono text-[#8C827A]">
                Unlocks Dec 16
              </span>
            </div>
            <h3 className="font-semibold text-sm text-[#1C1917] mt-1">
              Core DSA for Data Science & Algorithm Rigor
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Sliding window, vector space nearest neighbors, and memoization
              optimization.
            </p>
          </div>
        </div>

        {/* WEEK 04: UPCOMING */}
        <div className="relative pl-9 opacity-80 hover:opacity-100 transition-opacity">
          <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-[#FAF7F2] border-2 border-[#D1CCC5] flex items-center justify-center text-[#8C827A] z-10">
            <Lock className="w-3 h-3" />
          </div>

          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#EAE5DC]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-[#8C827A]">
                WEEK 04 • UPCOMING
              </span>
              <span className="text-[10px] font-mono text-[#8C827A]">
                Unlocks Dec 23
              </span>
            </div>
            <h3 className="font-semibold text-sm text-[#1C1917] mt-1">
              Production DBMS, Indexing & Feature Stores
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              B+ Tree indices, query plan optimization, and offline feature
              store architecture.
            </p>
          </div>
        </div>

        {/* WEEKS 05-08 */}
        <div className="relative pl-9 opacity-65">
          <div className="bg-[#F8F5EE] rounded-xl p-3 border border-[#EAE5DC] text-center">
            <span className="text-[11px] font-mono text-[#78716C]">
              Weeks 05–08: Deep Learning, System Design & Placement • 4
              Assessment Gates Ahead
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
