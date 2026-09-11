import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, Download, Layers, Activity, RefreshCw } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import MetricCard from '../components/brain/MetricCard';
import BlockerAlert from '../components/brain/BlockerAlert';
import CurricularFacetCard from '../components/brain/CurricularFacetCard';
import TelemetryStream from '../components/brain/TelemetryStream';
import ConceptMeshDAG from '../components/brain/ConceptMeshDAG';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { studentProfile, prerequisiteBlocker, curricularFacets } from '../data/mockData';

export default function StudentBrain() {
  const { setSidebarOpen } = useOutletContext();
  const { profile, user } = useAuth();
  const [diagnosticActive, setDiagnosticActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const studentId = profile?.auth_user_id || profile?.id || user?.id || 'rahul';
  const displayName = profile?.name || profile?.full_name || user?.user_metadata?.full_name || studentProfile.name;

  // Dynamic Brain States
  const [dynamicMetrics, setDynamicMetrics] = useState(studentProfile);
  const [dynamicFacets, setDynamicFacets] = useState(curricularFacets);
  const [dynamicTelemetry, setDynamicTelemetry] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadBrainData() {
      try {
        const [masteryRes, traceRes] = await Promise.all([
          studentService.getMastery(studentId),
          studentService.getTrace(studentId, 10),
        ]);

        if (mounted) {
          if (masteryRes.ok && masteryRes.data) {
            const m = masteryRes.data;
            const scorePct = Math.round((m.overall_score || 0.68) * 100);

            setDynamicMetrics({
              ...studentProfile,
              name: displayName,
              overallMastery: scorePct,
              bktWeight: Math.round((0.80 + scorePct * 0.0018) * 100) / 100,
              nodesUnlocked: Math.min(26, Math.max(10, Math.round((scorePct / 100) * 26))),
              cognitiveLoad: {
                ...studentProfile.cognitiveLoad,
                cliIndex: Math.round((0.55 + (100 - scorePct) * 0.002) * 100) / 100,
              },
              retention: {
                ...studentProfile.retention,
                sevenDayRetention: `${Math.min(98, Math.round(86 + scorePct * 0.12))}%`,
              },
            });

            // Map dynamic subjects to curricular facets
            if (m.subjects && m.subjects.length > 0) {
              const updatedFacets = curricularFacets.map((facet) => {
                const subMatch = m.subjects.find((s) => s.subject === facet.id);
                if (subMatch) {
                  const facetScore = Math.round((subMatch.average_score || 0.65) * 100);
                  return {
                    ...facet,
                    mastery: facetScore,
                    status: facetScore >= 80 ? 'MASTERED' : facetScore >= 50 ? 'LEARNING' : 'WEAK',
                    statusColor: facetScore >= 80 ? '#2E7D52' : facetScore >= 50 ? '#C07D1C' : '#B93826',
                  };
                }
                return facet;
              });
              setDynamicFacets(updatedFacets);
            }
          }

          if (traceRes.ok && traceRes.data?.entries?.length > 0) {
            setDynamicTelemetry(traceRes.data.entries);
          }
        }
      } catch (err) {
        console.error('Failed to load Student Brain telemetry:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBrainData();

    return () => {
      mounted = false;
    };
  }, [studentId, displayName]);

  const handleExportState = () => {
    const jsonStr = JSON.stringify(
      {
        student_id: studentId,
        student_name: displayName,
        timestamp: new Date().toISOString(),
        metrics: dynamicMetrics,
        facets: dynamicFacets,
        blockers: prerequisiteBlocker,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduhive-brain-state-${studentId.slice(0, 8)}.json`;
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
              <span className="text-[#A8421E] font-semibold">Student Model #{studentId.slice(0, 7)}</span>
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
          <MetricCard type="mastery" data={dynamicMetrics} />
          <MetricCard type="cognitive" data={dynamicMetrics} />
          <MetricCard type="retention" data={dynamicMetrics} />
          <MetricCard type="strategy" data={dynamicMetrics} />
        </div>

        {/* Prerequisite Blocker Alert Banner */}
        <BlockerAlert data={prerequisiteBlocker} />

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

          {/* 4 Facet Cards in 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dynamicFacets.map((facet) => (
              <CurricularFacetCard key={facet.id} facet={facet} />
            ))}
          </div>
        </div>

        {/* Bottom Row: Telemetry Stream + Concept Mesh DAG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Telemetry Stream (5 cols) */}
          <div className="lg:col-span-5">
            <TelemetryStream events={dynamicTelemetry} />
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
