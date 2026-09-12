import { useTranslation } from '../i18n';
import React, { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { Download, Sliders, Play, FileText, AlertTriangle } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import ProgressMetrics from "../components/progress/ProgressMetrics";
import RoadmapPathway from "../components/progress/RoadmapPathway";
import PlacementBenchmark from "../components/progress/PlacementBenchmark";
import TelemetryStream from "../components/brain/TelemetryStream";
import { useAuth } from "../context/AuthContext";
import { progressService } from "../services/progressService";
import { studentProfile } from "../data/mockData";
import { useStudentId } from "../hooks/useStudentId";
import { useTrace } from "../hooks/useStudent";

export default function ProgressRoadmap() {
  const { t } = useTranslation();
  const { setSidebarOpen } = useOutletContext();
  const { profile } = useAuth();
  const studentId = useStudentId();
  const studentGoal = profile?.goal || 'Placement Preparation';
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { entries } = useTrace(studentId, 10);

  useEffect(() => {
    let active = true;
    setLoading(true);
    progressService.getStudentProgress(studentId, studentGoal).then((data) => {
      if (active) { setProgressData(data); setLoading(false); }
    }).catch(() => { if (active) { setProgressData(null); setLoading(false); } });
    return () => { active = false; };
  }, [studentId, studentGoal]);

  const weakestTopic = progressData?.topics?.reduce((weakest, topic) => !weakest || topic.score < weakest.score ? topic : weakest, null);

  const customRightActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5] text-xs font-mono font-medium transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('progress.exportReport')}</span>
      </button>
      <Link
        to="/app/profile"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5] text-xs font-mono font-medium transition-colors"
      >
        <Sliders className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('progress.preferences')}</span>
      </Link>
    </div>
  );

  if (loading || !progressData) return <div className="min-h-screen bg-[#FAF7F2]"><TopBar onMenuClick={() => setSidebarOpen(true)} /><div className="max-w-7xl mx-auto p-8 text-sm font-mono text-[#8C827A]">Loading your learner model…</div></div>;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* Page Title & Top Stats Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FCE8E1] text-[#A8421E] font-mono text-[10px] font-semibold border border-[#F7CFC2] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8421E]"></span>
              {t('progress.subtitle')}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#1C1917] tracking-tight">
              {t('progress.title')}
            </h1>
            <p className="mt-1 text-sm text-[#57534E] max-w-2xl leading-relaxed">
              A combined view of your real-time mastery analytics, cognitive
              retention, and weekly curriculum targets—orchestrated by EduHive's
              adaptive AI specialists.
            </p>
          </div>

          {/* Top Right Quick Stats */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] shrink-0 font-mono">
            <div className="px-3 py-1 border-r border-[#F0ECE1]">
              <div className="text-[9px] uppercase tracking-wider text-[#8C827A]">
                {t('progress.overallMastery')}
              </div>
              <div className="text-xl font-bold text-[#1C1917]">
                {progressData.overallMastery}%
              </div>
            </div>
            <div className="px-3 py-1 border-r border-[#F0ECE1]">
              <div className="text-[9px] uppercase tracking-wider text-[#8C827A]">
                {t('progress.sprintPace')}
              </div>
              <div className="text-xl font-bold text-[#2E7D52]">
                Week {progressData.sprintPace?.currentWeek || 2}{" "}
                <span className="text-xs text-[#8C827A]">/ 8</span>
              </div>
            </div>
            <div className="px-3 py-1">
              <div className="text-[9px] uppercase tracking-wider text-[#8C827A]">
                {t('progress.placementFit')}
              </div>
              <div className="text-xl font-bold text-[#A8421E]">
                {progressData.placementFit}
                <span className="text-xs text-[#8C827A]">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <ProgressMetrics progressData={progressData} />

        {/* Diagnostic Blocker Alert */}
        <div className="bg-[#FDF4F0] border border-[#F5C7B8] rounded-xl p-4 md:p-5 shadow-[0_2px_10px_rgba(168,66,30,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FCE8E1] border border-[#F7CFC2] flex items-center justify-center text-[#B93826] shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[#B93826] tracking-wider uppercase">
                  {t('progress.blocker')}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FDF0ED] text-[#B93826] border border-[#F7CFC2] font-semibold">
                  {weakestTopic
                    ? `${Math.round(weakestTopic.score * 100)}% Weak Score`
                    : "Diagnostic pending"}
                </span>
              </div>
              <div className="text-sm font-semibold text-[#1C1917] mt-0.5">
                {weakestTopic
                  ? `${weakestTopic.topic.replace(/_/g, " ")} is your current focus area`
                  : "Your first diagnostic is ready to identify a focus area"}
              </div>
              <div className="text-xs text-[#57534E] mt-0.5">
                Complete a guided Socratic exercise on this topic to update your
                mastery and unlock the next milestone.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/app/tutor"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t('progress.startDrill')}</span>
            </Link>
          </div>
        </div>

        {/* Main Content Grid: Pathway (Left 65%) vs Benchmark (Right 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 8-Week Pathway */}
          <div className="lg:col-span-8">
            <RoadmapPathway progressData={progressData} />
          </div>

          {/* Right Column: Facets Summary + Placement Match + Mentor */}
          <div className="lg:col-span-4 space-y-5">
            <PlacementBenchmark progressData={progressData} />
          </div>
        </div>

        {/* Bottom Section: Recent Telemetry Stream */}
        <div className="mt-4">
          <TelemetryStream />
        </div>
      </div>
    </div>
  );
}
function pretty(v){return String(v||'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());}
