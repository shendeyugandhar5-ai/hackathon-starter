import { useTranslation } from '../i18n';
import React, { useState, Component } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
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

// Page-level Error Boundary to ensure the page never renders blank
class StudentBrainErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StudentBrain Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] p-8 flex items-center justify-center">
          <div className="bg-white rounded-xl border border-[#EAE5DC] p-6 max-w-lg shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDF0ED] text-[#B93826] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl text-[#1C1917]">{t('brain.unableToLoad')}</h2>
            <p className="text-xs text-[#57534E]">
              {t('brain.loadErrorHint')}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-[#A8421E] text-white rounded-lg text-xs font-semibold hover:bg-[#8E3516] transition-colors cursor-pointer"
            >
              {t('brain.retry')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function toFacet(subject, topics) {
  const mine = topics.filter((topic) => topic.subject === subject.subject);
  const weakest = mine.reduce(
    (result, topic) => (!result || topic.score < result.score ? topic : result),
    null,
  );
  const strongest = mine.reduce(
    (result, topic) => (!result || topic.score > result.score ? topic : result),
    null,
  );
  const mastery = Math.round((subject.average_score || 0) * 100);
  const isWeak = (subject.weak_topics || []).length > 0 || mastery < 50;
  const highlight = isWeak ? weakest : strongest || weakest;
  const icon =
    { dsa: "Code2", dbms: "Database", maths: "Sigma", aiml: "Sparkles" }[
      subject.subject
    ] || "Sparkles";

  return {
    id: subject.subject,
    icon,
    discipline: (AGENT_STYLES[subject.subject] || AGENT_STYLES.general).label,
    conceptCount: subject.topic_count || mine.length || 0,
    mastery,
    status: mastery >= 75 ? "MASTERED" : isWeak ? "WEAK" : "LEARNING",
    hasLeftAccent: isWeak,
    topStrength: {
      isWeak,
      title: highlight ? pretty(highlight.topic) : "No topic yet",
      detail: highlight
        ? `${Math.round(highlight.score * 100)}% mastery`
        : "Awaiting assessment",
      badge: highlight
        ? `${Math.round(highlight.score * 100)}% ${isWeak ? "Weak" : "Mastery"}`
        : "NEW",
    },
    activeFocus: {
      isGap: isWeak,
      title: weakest
        ? pretty(weakest.topic)
        : strongest
          ? pretty(strongest.topic)
          : "Diagnostic baseline",
      detail: weakest ? "Priority remediation" : "Continue strengthening",
    },
  };
}

class StudentBrainErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("StudentBrain rendering error:", error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-8 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-[#EAE5DC] p-6 max-w-lg text-center space-y-4">
          <AlertTriangle className="w-8 h-8 mx-auto text-[#B93826]" />
          <h2 className="font-serif text-2xl text-[#1C1917]">
            Unable to load Student Brain
          </h2>
          <p className="text-xs text-[#57534E]">
            The live student model could not be rendered.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-[#A8421E] text-white rounded-lg text-xs font-semibold"
          >
            Retry Student Brain
          </button>
        </div>
      </div>
    );
  }
}

function StudentBrainContent() {
  const outletContext = useOutletContext();
  const setSidebarOpen = outletContext?.setSidebarOpen || (() => {});
  const { profile, user } = useAuth();
  const [diagnosticActive, setDiagnosticActive] = useState(false);
  const studentId = useStudentId();
  const displayName =
    profile?.name || user?.user_metadata?.full_name || "Learner";
  const {
    topics = [],
    subjects = [],
    overallPercent = 0,
    weakTopics = [],
    masteredTopics = [],
    loading,
    error,
  } = useMastery(studentId);
  const { topGap } = useRootCause(studentId);
  const { entries: liveTelemetry = [] } = useTrace(studentId, 10);
  const attempts = topics.reduce(
    (sum, topic) => sum + Number(topic.attempts || 0),
    0,
  );
  const liveProfile = {
    overallMastery: overallPercent,
    nodesUnlocked: masteredTopics.length,
    totalNodes: topics.length,
    attempts,
    weakCount: weakTopics.length,
  };
  const liveFacets = subjects.map((subject) => toFacet(subject, topics));
  const liveBlocker = topGap
    ? {
        detected: true,
        agent: "COORDINATOR AGENT DIAGNOSTIC",
        priority: `High (${Number(topGap.weight || 0).toFixed(2)})`,
        title: `${pretty(topGap.blocks)} is blocked by a prerequisite gap`,
        description: `${pretty(topGap.prerequisite)} is at ${Math.round((topGap.score || 0) * 100)}% and gates ${pretty(topGap.blocks)} at ${Math.round((topGap.blocked_score || 0) * 100)}%.`,
        sourceNode: {
          category: `${String(topGap.prerequisite_subject || "Maths").toUpperCase()} Node`,
          score: Math.round((topGap.score || 0) * 100),
          state: "WEAK",
          title: pretty(topGap.prerequisite),
        },
        targetNode: {
          category: `${String(topGap.blocks_subject || "AIML").toUpperCase()} Node`,
          score: Math.round((topGap.blocked_score || 0) * 100),
          state: "LEARNING",
          title: pretty(topGap.blocks),
        },
      }
    : null;

  const handleExportState = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            student_id: studentId,
            student_name: displayName,
            overall_mastery: overallPercent,
            topics,
            subjects,
            root_cause: topGap,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `eduhive-brain-state-${String(studentId).slice(0, 8)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        
        {/* Workspace Context & Page Title Section */}
        <div>
          {/* Breadcrumb Context Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#8C827A]">
              <span>{t('brain.workspaceContext')}</span>
              <span>/</span>
              <span className="text-[#A8421E] font-semibold">Student Model #{String(studentId).slice(0, 7)}</span>
              <span>/</span>
              <span>{t('brain.bkt')}</span>
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
                <span>{t('brain.exportState')}</span>
              </button>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-[#1C1917]">
              {displayName}'s Learning Brain
            </h1>
            <p className="mt-1 text-sm text-[#57534E] max-w-3xl">
              EduHive continuously updates its probabilistic model of what you
              know and where you need prerequisite reinforcement.
            </p>
          </div>

          {/* Editorial Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#1C1917] tracking-tight">
                {t('brain.title')}
              </h1>
              <p className="mt-1 text-sm text-[#57534E] max-w-3xl leading-relaxed">
                EduHive continuously updates its probabilistic model of what you know, what you're learning, and where you need prerequisite reinforcement.
              </p>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#8C827A] bg-white px-3 py-1.5 rounded-lg border border-[#EAE5DC] shadow-2xs self-start md:self-auto">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A8421E]" />
                <span>{t('brain.syncing')}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setDiagnosticActive((active) => !active)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-[#DDD5C5]"
            >
              <Activity className="w-3.5 h-3.5" />
              {diagnosticActive ? "Active Diagnostic" : "Diagnostic Mode"}
            </button>
            <button
              type="button"
              onClick={handleExportState}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-[#DDD5C5]"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard type="mastery" data={liveProfile} />
          <MetricCard type="cognitive" data={liveProfile} />
          <MetricCard type="retention" data={liveProfile} />
          <MetricCard type="strategy" data={liveProfile} />
        </div>
        <BlockerAlert data={liveBlocker} />
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl md:text-2xl font-normal text-[#1C1917] tracking-tight">
                {t('brain.facets')}
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                {t('brain.subtitle')}
              </p>
            </div>

            {/* Facet status legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#78716C]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D52]"></span>
                {t('brain.mastered')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C07D1C]"></span>
                {t('brain.learning')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B93826]"></span>
                {t('brain.weak')}
              </span>
            </div>
          )}
        </div>
        <LiveMasteryPanel
          subjects={subjects}
          topics={topics}
          overallPercent={overallPercent}
          loading={loading}
          error={error}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-5">
            <TelemetryStream events={liveTelemetry} />
          </div>
          <div className="lg:col-span-7">
            <ConceptMeshDAG
              nodes={topics.map((topic) => ({
                id: `${topic.subject}-${topic.topic}`,
                name: pretty(topic.topic),
                score: Math.round(Number(topic.score || 0) * 100),
                state: topic.state,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentBrain() {
  const { t } = useTranslation();
  return (
    <StudentBrainErrorBoundary>
      <StudentBrainContent />
    </StudentBrainErrorBoundary>
  );
}
