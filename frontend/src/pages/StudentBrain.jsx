import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Activity } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import MetricCard from '../components/brain/MetricCard';
import BlockerAlert from '../components/brain/BlockerAlert';
import CurricularFacetCard from '../components/brain/CurricularFacetCard';
import TelemetryStream from '../components/brain/TelemetryStream';
import ConceptMeshDAG from '../components/brain/ConceptMeshDAG';
import LiveMasteryPanel from '../components/brain/LiveMasteryPanel';
import { useMastery, useRootCause, useTrace } from '../hooks/useStudent';
import { useStudentId } from '../hooks/useStudentId';
import { AGENT_STYLES } from '../services/api';
import { studentProfile, prerequisiteBlocker, curricularFacets } from '../data/mockData';

/** Map one live subject rollup onto the shape CurricularFacetCard expects. */
function toFacet(subject, topics) {
  const mine = topics.filter((t) => t.subject === subject.subject);
  const weakest = mine.reduce(
    (lowest, t) => (!lowest || t.score < lowest.score ? t : lowest),
    null
  );
  const strongest = mine.reduce(
    (best, t) => (!best || t.score > best.score ? t : best),
    null
  );
  const mastery = Math.round(subject.average_score * 100);
  const isWeak = subject.weak_topics.length > 0;
  const highlight = isWeak ? weakest : strongest;

  return {
    id: subject.subject,
    icon: subject.subject,
    discipline: (AGENT_STYLES[subject.subject] || AGENT_STYLES.general).label,
    conceptCount: subject.topic_count,
    mastery,
    status: mastery >= 75 ? 'MASTERED' : isWeak ? 'WEAK' : 'LEARNING',
    hasLeftAccent: isWeak,
    topStrength: {
      isWeak,
      title: (highlight?.topic || '—').replace(/_/g, ' '),
      detail: highlight ? `${Math.round(highlight.score * 100)}% mastery` : '',
    },
  };
}

export default function StudentBrain() {
  const { setSidebarOpen } = useOutletContext();
  const [diagnosticActive, setDiagnosticActive] = useState(false);

  const studentId = useStudentId();
  const { topics, subjects, overallPercent, weakTopics, masteredTopics, loading, error } =
    useMastery(studentId);
  const { topGap } = useRootCause(studentId);
  const { entries: liveTelemetry } = useTrace(studentId, 10);

  // Live values where the backend has them; design-only fields stay from the mock
  const liveProfile = {
    ...studentProfile,
    overallMastery: loading ? studentProfile.overallMastery : overallPercent,
    nodesUnlocked: masteredTopics.length || studentProfile.nodesUnlocked,
    totalNodes: topics.length || studentProfile.totalNodes,
  };

  const liveFacets = subjects.length
    ? subjects.map((s) => toFacet(s, topics))
    : curricularFacets;

  const liveBlocker = topGap
    ? {
        ...prerequisiteBlocker,
        detected: true,
        priority: `High (${topGap.weight?.toFixed(2) ?? '0.90'})`,
        title: `${topGap.blocks.replace(/_/g, ' ')} is blocked by a prerequisite gap`,
        description:
          `Your ${topGap.blocks.replace(/_/g, ' ')} mastery is capped at ` +
          `${Math.round(topGap.blocked_score * 100)}% because it depends on ` +
          `${topGap.prerequisite.replace(/_/g, ' ')}, currently at ` +
          `${Math.round(topGap.score * 100)}%. Repairing the prerequisite lifts both.`,
        sourceNode: {
          ...prerequisiteBlocker.sourceNode,
          category: `${(topGap.prerequisite_subject || '').toUpperCase()} Node`,
          score: Math.round(topGap.score * 100),
          state: 'WEAK',
          title: topGap.prerequisite.replace(/_/g, ' '),
        },
      }
    : prerequisiteBlocker;

  const handleExportState = () => {
    const jsonStr = JSON.stringify(
      {
        student_id: studentId,
        timestamp: new Date().toISOString(),
        overall_mastery: overallPercent,
        topics,
        subjects,
        root_cause: topGap,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduhive-brain-state-${String(studentId).slice(0, 8)}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      {/* Top Workspace Bar */}
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        
        {/* Workspace Context & Page Title Section */}
        <div>
          {/* Breadcrumb Context Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#8C827A]">
              <span>WORKSPACE CONTEXT</span>
              <span>/</span>
              <span className="text-[#A8421E] font-semibold">Student Model #{String(studentId).slice(0, 7)}</span>
              <span>/</span>
              <span>Bayesian Knowledge Tracing</span>
            </div>

            {/* Quick Action Pills */}
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setDiagnosticActive(!diagnosticActive)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer ${
                  diagnosticActive 
                    ? 'bg-[#A8421E] text-white border-[#A8421E]' 
                    : 'bg-[#F4EFE6] hover:bg-[#EAE4D7] text-[#57534E] border-[#DDD5C5]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{diagnosticActive ? 'Active Diagnostic' : 'Diagnostic Mode'}</span>
              </button>

              <button 
                type="button"
                onClick={handleExportState}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFE6] hover:bg-[#EAE4D7] text-[#57534E] border border-[#DDD5C5] text-xs font-mono font-medium transition-colors cursor-pointer"
                title="Export Knowledge State JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Knowledge State</span>
              </button>
            </div>
          </div>

          {/* Editorial Title */}
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#1C1917] tracking-tight">
            Your Learning Brain
          </h1>
          <p className="mt-1 text-sm text-[#57534E] max-w-3xl leading-relaxed">
            EduHive continuously updates its probabilistic model of what you know, what you're learning, and where you need prerequisite reinforcement.
          </p>
        </div>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard type="mastery" data={liveProfile} />
          <MetricCard type="cognitive" data={liveProfile} />
          <MetricCard type="retention" data={liveProfile} />
          <MetricCard type="strategy" data={liveProfile} />
        </div>

        {/* Prerequisite Blocker Alert Banner */}
        <BlockerAlert data={liveBlocker} />

        {/* Curricular Knowledge Facets Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl md:text-2xl font-normal text-[#1C1917] tracking-tight">
                Curricular Knowledge Facets
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Probabilistic state tracking across your core engineering disciplines
              </p>
            </div>

            {/* Facet status legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#78716C]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D52]"></span>
                Mastered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C07D1C]"></span>
                Learning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B93826]"></span>
                Weak
              </span>
            </div>
          </div>

          {/* Facet cards, driven by live per-subject mastery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveFacets.map((facet) => (
              <CurricularFacetCard key={facet.id} facet={facet} />
            ))}
          </div>
        </div>

        {/* Live topic-level mastery straight from the Progress Engine */}
        <LiveMasteryPanel
          subjects={subjects}
          topics={topics}
          overallPercent={overallPercent}
          loading={loading}
          error={error}
        />

        {/* Bottom Row: Telemetry Stream + Concept Mesh DAG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Telemetry Stream (5 cols) */}
          <div className="lg:col-span-5">
            <TelemetryStream events={liveTelemetry} />
          </div>

          {/* Concept Mesh DAG (7 cols) */}
          <div className="lg:col-span-7">
            <ConceptMeshDAG />
          </div>
        </div>

      </div>
    </div>
  );
}
