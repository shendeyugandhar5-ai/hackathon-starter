import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Download, Sliders, Play, FileText, AlertTriangle } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import ProgressMetrics from '../components/progress/ProgressMetrics';
import RoadmapPathway from '../components/progress/RoadmapPathway';
import PlacementBenchmark from '../components/progress/PlacementBenchmark';
import TelemetryStream from '../components/brain/TelemetryStream';
import { studentProfile } from '../data/mockData';

export default function ProgressRoadmap() {
  const { setSidebarOpen } = useOutletContext();

  const customBreadcrumbs = (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex items-center gap-1.5 font-medium text-[#1C1917]">
        <span className="w-2 h-2 rounded-full bg-[#A8421E]"></span>
        {studentProfile.cohort}
      </span>
      <span className="text-[#8C827A]">/</span>
      <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5]">
        Cohort Sprint {studentProfile.sprintCode}
      </span>
      <span className="text-[#8C827A] hidden sm:inline">/</span>
      <span className="font-mono text-[11px] text-[#2E7D52] hidden sm:inline">
        Sync: 18ms
      </span>
    </div>
  );

  const customRightActions = (
    <div className="flex items-center gap-2">
      <button className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5] text-xs font-mono font-medium transition-colors">
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Export Report</span>
      </button>
      <button className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5] text-xs font-mono font-medium transition-colors">
        <Sliders className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Settings</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      {/* Top Workspace Header */}
      <TopBar 
        onMenuClick={() => setSidebarOpen(true)}
        breadcrumbCustom={customBreadcrumbs}
        rightActions={customRightActions}
      />

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        
        {/* Page Title & Top Stats Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FCE8E1] text-[#A8421E] font-mono text-[10px] font-semibold border border-[#F7CFC2] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8421E]"></span>
              Unified Learner Analytics & Curriculum Roadmap
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#1C1917] tracking-tight">
              Learning Progress & Milestones
            </h1>
            <p className="mt-1 text-sm text-[#57534E] max-w-2xl leading-relaxed">
              A combined view of your real-time mastery analytics, cognitive retention, and weekly curriculum targets—orchestrated by EduHive's adaptive AI specialists.
            </p>
          </div>

          {/* Top Right Quick Stats */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] shrink-0 font-mono">
            <div className="px-3 py-1 border-r border-[#F0ECE1]">
              <div className="text-[9px] uppercase tracking-wider text-[#8C827A]">OVERALL MASTERY</div>
              <div className="text-xl font-bold text-[#1C1917]">{studentProfile.overallMastery}%</div>
            </div>
            <div className="px-3 py-1 border-r border-[#F0ECE1]">
              <div className="text-[9px] uppercase tracking-wider text-[#8C827A]">SPRINT PACE</div>
              <div className="text-xl font-bold text-[#2E7D52]">Week 2 <span className="text-xs text-[#8C827A]">/ 8</span></div>
            </div>
            <div className="px-3 py-1">
              <div className="text-[9px] uppercase tracking-wider text-[#8C827A]">PLACEMENT FIT</div>
              <div className="text-xl font-bold text-[#A8421E]">{studentProfile.placementFit}<span className="text-xs text-[#8C827A]">/100</span></div>
            </div>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <ProgressMetrics />

        {/* Diagnostic Blocker Alert */}
        <div className="bg-[#FDF4F0] border border-[#F5C7B8] rounded-xl p-4 md:p-5 shadow-[0_2px_10px_rgba(168,66,30,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FCE8E1] border border-[#F7CFC2] flex items-center justify-center text-[#B93826] shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-[#B93826] tracking-wider uppercase">
                  CURRICULUM DIAGNOSTIC BLOCKER
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FDF0ED] text-[#B93826] border border-[#F7CFC2] font-semibold">
                  42% Weak Score
                </span>
              </div>
              <div className="text-sm font-semibold text-[#1C1917] mt-0.5">
                Conditional Probability is holding back your Week 2 Naive Bayes progress
              </div>
              <div className="text-xs text-[#57534E] mt-0.5">
                The Maths specialist detected prior vs. posterior confusion. A quick 10-minute guided Socratic exercise will clear this milestone and unlock Gate 2.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/app/tutor?mode=drill"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start 10-min Drill</span>
            </Link>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#57534E] border border-[#E7E2D7] text-xs font-medium transition-colors">
              <span>View Derivation</span>
            </button>
          </div>
        </div>

        {/* Main Content Grid: Pathway (Left 65%) vs Benchmark (Right 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 8-Week Pathway */}
          <div className="lg:col-span-8">
            <RoadmapPathway />
          </div>

          {/* Right Column: Facets Summary + Placement Match + Mentor */}
          <div className="lg:col-span-4 space-y-5">
            <PlacementBenchmark />
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
