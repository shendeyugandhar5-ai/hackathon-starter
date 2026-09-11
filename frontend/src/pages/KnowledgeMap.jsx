import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { 
  Network, 
  Filter, 
  Maximize2, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  Compass, 
  Check, 
  Lock, 
  Play, 
  MessageSquare, 
  HelpCircle, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Sliders,
  Move
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { knowledgeService, BASE_CONCEPT_NODES } from '../services/knowledgeService';

export default function KnowledgeMap() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();
  const { profile, user } = useAuth();
  const studentId = profile?.auth_user_id || profile?.id || user?.id || 'rahul';

  const [selectedSubject, setSelectedSubject] = useState('ds_aiml');
  const [selectedNodeId, setSelectedNodeId] = useState('cond_prob');
  const [nodes, setNodes] = useState(BASE_CONCEPT_NODES);
  const [bottlenecks, setBottlenecks] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadGraph() {
      try {
        const res = await knowledgeService.getConceptGraph(studentId);
        if (mounted && res.nodes) {
          setNodes(res.nodes);
          setBottlenecks(res.bottlenecks || []);
        }
      } catch (err) {
        console.error('Failed to load concept ontology:', err);
      }
    }
    loadGraph();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const subjects = [
    { id: 'all', label: 'All Subjects' },
    { id: 'ds_aiml', label: 'Data Science & AIML', isCurrent: true },
    { id: 'maths', label: 'Maths' },
    { id: 'dsa', label: 'DSA' },
    { id: 'dbms', label: 'DBMS' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Top Workspace Header */}
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Workspace Canvas */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        
        {/* Page Title & Subject Filters */}
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#1C1917] tracking-tight">
            Knowledge Graph & Prerequisite Ontology
          </h1>
          <p className="mt-1 text-xs md:text-sm text-[#57534E] max-w-3xl leading-relaxed">
            Explore interconnected concept dependencies across Data Science & Computer Science curricula. Visualized in real time by the EduHive Coordinator Agent.
          </p>

          {/* Subject Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                  selectedSubject === sub.id
                    ? 'bg-[#A8421E] text-white border-[#A8421E] font-semibold shadow-2xs'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#57534E] border-[#EAE5DC]'
                }`}
              >
                {sub.id === 'ds_aiml' && <span className="mr-1.5">🌐</span>}
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Split: DAG Visualizer (Left 65%) vs Node Inspector (Right 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: DAG Canvas + 3 Analytics Cards (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Main Interactive DAG Container */}
            <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 md:p-5 flex flex-col justify-between">
              
              {/* DAG Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#A8421E]"></span>
                  <span className="font-bold text-[#1C1917] uppercase tracking-wider">
                    INTERACTIVE DIRECTED ACYCLIC GRAPH (DAG)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono text-[#8C827A]">
                  <span>{nodes.length} Nodes • 7 Prerequisite Edges</span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EAE5DC] text-[#57534E] flex items-center gap-1">
                    <Move className="w-3 h-3" /> Drag to Pan
                  </span>
                </div>
              </div>

              {/* SVG Concept Topology Canvas */}
              <div className="my-4 relative bg-[#FCFAF7] rounded-xl border border-[#EAE5DC] p-4 overflow-hidden select-none min-h-[380px] flex items-center justify-center">
                <svg viewBox="0 0 680 340" className="w-full h-auto">
                  <defs>
                    <marker id="arrow-grey" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#D1CCC5" />
                    </marker>
                    <marker id="arrow-red-active" viewBox="0 0 10 10" refX="30" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#B93826" />
                    </marker>
                    <marker id="arrow-amber" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#C07D1C" />
                    </marker>
                  </defs>

                  {/* Lineage Splines */}
                  <path d="M 190,95 C 240,95 250,110 290,115" fill="none" stroke="#B93826" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrow-red-active)" className="animate-pulse" />
                  <path d="M 190,260 L 290,260" fill="none" stroke="#D1CCC5" strokeWidth="1.5" markerEnd="url(#arrow-grey)" />
                  <path d="M 390,260 L 490,260" fill="none" stroke="#D1CCC5" strokeWidth="1.5" markerEnd="url(#arrow-grey)" />
                  <path d="M 340,240 C 340,190 340,165 340,145" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-grey)" />
                  <path d="M 400,115 C 440,115 450,105 480,95" fill="none" stroke="#B93826" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrow-red-active)" />
                  <path d="M 570,95 C 590,95 600,105 615,115" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-grey)" />
                  <path d="M 540,240 C 580,220 600,170 625,145" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-grey)" />

                  {/* NODES */}
                  {/* SQL Indexing */}
                  <g className="cursor-pointer" onClick={() => setSelectedNodeId('sql_indexing')}>
                    <rect x="90" y="240" width="110" height="42" rx="8" fill="#EAF4EE" stroke="#2E7D52" strokeWidth="1.5" />
                    <text x="145" y="257" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">✓ SQL Indexing</text>
                    <text x="145" y="271" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#2E7D52]">MASTERED 92%</text>
                  </g>

                  {/* DP Knapsack */}
                  <g className="cursor-pointer" onClick={() => setSelectedNodeId('dp_knapsack')}>
                    <rect x="290" y="240" width="110" height="42" rx="8" fill="#FCF4E6" stroke="#C07D1C" strokeWidth="1.5" />
                    <text x="345" y="257" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">● DP (Knapsack)</text>
                    <text x="345" y="271" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#C07D1C]">LEARNING 74%</text>
                  </g>

                  {/* Gradient Descent */}
                  <g className="cursor-pointer" onClick={() => setSelectedNodeId('loss_gradient')}>
                    <rect x="490" y="240" width="110" height="42" rx="8" fill="#EAF4EE" stroke="#2E7D52" strokeWidth="1.5" />
                    <text x="545" y="257" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">✓ Loss & Gradient</text>
                    <text x="545" y="271" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#2E7D52]">MASTERED 81%</text>
                  </g>

                  {/* CONDITIONAL PROBABILITY (ACTIVE BLOCKER NODE) */}
                  <g 
                    className="cursor-pointer"
                    onClick={() => setSelectedNodeId('cond_prob')}
                  >
                    <rect x="278" y="88" width="134" height="54" rx="10" fill="none" stroke="#B93826" strokeWidth="1.5" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />
                    <rect x="282" y="92" width="126" height="46" rx="8" fill="#FDF0ED" stroke="#B93826" strokeWidth="2" strokeDasharray="4,2" />
                    <text x="345" y="109" textAnchor="middle" className="text-[10px] font-bold fill-[#B93826]">! Conditional Prob.</text>
                    <text x="345" y="120" textAnchor="middle" className="text-[7.5px] font-mono fill-[#8C827A]">ONT-MTH-PR-024</text>
                    <rect x="295" y="124" width="100" height="12" rx="3" fill="#B93826" />
                    <text x="345" y="132.5" textAnchor="middle" className="text-[7px] font-mono font-bold fill-white tracking-wide">
                      {activeNode.id === 'cond_prob' ? `CRITICAL ${activeNode.score}% WEAK` : 'CRITICAL 42% WEAK'}
                    </text>
                  </g>

                  {/* Bayes' Theorem */}
                  <g className="cursor-pointer" onClick={() => setSelectedNodeId('bayes_rule')}>
                    <rect x="475" y="75" width="110" height="42" rx="8" fill="#FCF4E6" stroke="#C07D1C" strokeWidth="1.5" />
                    <text x="530" y="92" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">● Bayes' Theorem</text>
                    <text x="530" y="106" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#C07D1C]">LEARNING 68%</text>
                  </g>

                  {/* Naive Bayes */}
                  <g className="cursor-pointer" onClick={() => setSelectedNodeId('naive_bayes')}>
                    <rect x="580" y="115" width="95" height="42" rx="8" fill="#FAF7F2" stroke="#A8A29E" strokeWidth="1.5" />
                    <text x="627" y="132" textAnchor="middle" className="text-[10px] font-semibold fill-[#57534E]">○ Naive Bayes</text>
                    <text x="627" y="146" textAnchor="middle" className="text-[8px] font-mono fill-[#8C827A]">TARGET CAPSTONE</text>
                  </g>
                </svg>
              </div>

              {/* DAG Canvas Footer Legend */}
              <div className="pt-2 border-t border-[#F0ECE1] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#78716C]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2E7D52]"></span> Mastered (&gt;80%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C07D1C]"></span> Learning (50-80%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B93826]"></span> Critical Blocker (&lt;50%)</span>
                </div>
                <div className="flex items-center gap-1 text-[#A8421E] font-medium">
                  <span>Prerequisite Lineage Active</span>
                </div>
              </div>
            </div>

            {/* 3 Bottom Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-xl border border-[#EAE5DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">IDENTIFIED BOTTLENECKS</span>
                <div className="font-serif text-lg text-[#B93826] font-normal">{bottlenecks.length || 1} Critical Barrier</div>
                <p className="text-[11px] text-[#57534E]">Conditional independence definition blocks Naive Bayes progression.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#EAE5DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">VELOCITY TO TARGET</span>
                <div className="font-serif text-lg text-[#2E7D52] font-normal">+14% / Wk</div>
                <p className="text-[11px] text-[#57534E]">Paced to complete Machine Learning capstone by Sprint Week 4.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#EAE5DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">GRAPH AUTO-REPAIR</span>
                <div className="font-serif text-lg text-[#1C1917] font-normal">Active Socratic Splicing</div>
                <p className="text-[11px] text-[#57534E]">Coordinator dispatches Maths + AIML tutors in tandem.</p>
              </div>
            </div>

          </div>

          {/* Right Column: Node Diagnostic Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B93826] animate-pulse"></span>
                <span className="font-mono text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  NODE DIAGNOSTIC INSPECTOR
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                activeNode.state === 'mastered' ? 'bg-[#EAF4EE] text-[#2E7D52] border-[#CDE5D5]' :
                activeNode.state === 'learning' ? 'bg-[#FCF4E6] text-[#C07D1C] border-[#F2D8B3]' :
                'bg-[#FDF0ED] text-[#B93826] border-[#F7CFC2]'
              }`}>
                {activeNode.state.toUpperCase()} {activeNode.score}%
              </span>
            </div>

            {/* Node Title & Description */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8421E] font-semibold">
                {activeNode.category}
              </span>
              <h3 className="font-serif text-xl font-normal text-[#1C1917] mt-0.5">
                {activeNode.name}
              </h3>
              <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                {activeNode.description}
              </p>
            </div>

            {/* Misconception Alert Box */}
            <div className="p-3.5 rounded-xl bg-[#FDF0ED] border border-[#F7CFC2] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B93826]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Detected Misconception Pattern</span>
              </div>
              <p className="text-xs text-[#57534E] leading-snug">
                {activeNode.misconception}
              </p>
            </div>

            {/* Prerequisite Chain & Unlocks */}
            <div className="space-y-3 pt-2 border-t border-[#F0ECE1] text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#8C827A] uppercase font-semibold">Prerequisites:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {activeNode.prerequisites.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EAE5DC] text-[11px] font-mono text-[#57534E]">
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8C827A] uppercase font-semibold">Direct Unlocks:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {activeNode.unlocks.map((u) => (
                    <span key={u} className="px-2 py-0.5 rounded bg-[#FDF2EE] border border-[#FADCD1] text-[11px] font-mono text-[#A8421E]">
                      {u.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Socratic Session CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/app/tutor')}
                className="w-full py-2.5 px-4 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Launch Socratic Drill ({activeNode.actionPlanTime})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
