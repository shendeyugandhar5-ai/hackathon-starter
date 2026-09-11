import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
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
import { studentProfile } from '../data/mockData';

export default function KnowledgeMap() {
  const { setSidebarOpen } = useOutletContext();
  const [selectedSubject, setSelectedSubject] = useState('ds_aiml');
  const [selectedNode, setSelectedNode] = useState('cond_prob');

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
                  <span>8 Nodes • 7 Prerequisite Edges</span>
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

                  {/* Connecting Lineage Splines */}
                  {/* Basic Prob -> Conditional Prob */}
                  <path d="M 190,95 C 240,95 250,110 290,115" fill="none" stroke="#B93826" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrow-red-active)" className="animate-pulse" />
                  {/* Linear Alg -> Vector Spaces */}
                  <path d="M 190,260 L 290,260" fill="none" stroke="#D1CCC5" strokeWidth="1.5" markerEnd="url(#arrow-grey)" />
                  {/* Vector Spaces -> Gradient Descent */}
                  <path d="M 390,260 L 490,260" fill="none" stroke="#D1CCC5" strokeWidth="1.5" markerEnd="url(#arrow-grey)" />
                  {/* Vector Spaces -> Conditional Prob (Prereq connection) */}
                  <path d="M 340,240 C 340,190 340,165 340,145" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-grey)" />
                  {/* Conditional Prob -> Bayes Theorem */}
                  <path d="M 400,115 C 440,115 450,105 480,95" fill="none" stroke="#B93826" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrow-red-active)" />
                  {/* Bayes Theorem -> Naive Bayes */}
                  <path d="M 570,95 C 590,95 600,105 615,115" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-grey)" />
                  {/* Gradient Descent -> Naive Bayes */}
                  <path d="M 540,240 C 580,220 600,170 625,145" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrow-grey)" />

                  {/* BOTTOM FOUNDATION NODES */}
                  {/* 1. Linear Algebra */}
                  <g className="cursor-pointer">
                    <rect x="90" y="240" width="110" height="42" rx="8" fill="#EAF4EE" stroke="#2E7D52" strokeWidth="1.5" />
                    <text x="145" y="257" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">✓ Linear Algebra</text>
                    <text x="145" y="271" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#2E7D52]">MASTERED 95%</text>
                  </g>

                  {/* 2. Vector Spaces */}
                  <g className="cursor-pointer">
                    <rect x="290" y="240" width="110" height="42" rx="8" fill="#EAF4EE" stroke="#2E7D52" strokeWidth="1.5" />
                    <text x="345" y="257" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">✓ Vector Spaces</text>
                    <text x="345" y="271" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#2E7D52]">MASTERED 92%</text>
                  </g>

                  {/* 3. Gradient Descent */}
                  <g className="cursor-pointer">
                    <rect x="490" y="240" width="110" height="42" rx="8" fill="#EAF4EE" stroke="#2E7D52" strokeWidth="1.5" />
                    <text x="545" y="257" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">✓ Gradient Descent</text>
                    <text x="545" y="271" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#2E7D52]">MASTERED 91%</text>
                  </g>

                  {/* MID TIER NODES */}
                  {/* 4. Basic Probability */}
                  <g className="cursor-pointer">
                    <rect x="90" y="75" width="110" height="42" rx="8" fill="#EAF4EE" stroke="#2E7D52" strokeWidth="1.5" />
                    <text x="145" y="92" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">✓ Basic Probability</text>
                    <text x="145" y="106" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#2E7D52]">MASTERED 89%</text>
                  </g>

                  {/* 5. CONDITIONAL PROBABILITY (ACTIVE BLOCKER NODE - HIGHLIGHTED) */}
                  <g 
                    className="cursor-pointer"
                    onClick={() => setSelectedNode('cond_prob')}
                  >
                    {/* Pulsing warning aura */}
                    <rect x="278" y="88" width="134" height="54" rx="10" fill="none" stroke="#B93826" strokeWidth="1.5" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />
                    <rect x="282" y="92" width="126" height="46" rx="8" fill="#FDF0ED" stroke="#B93826" strokeWidth="2" strokeDasharray="4,2" />
                    <text x="345" y="109" textAnchor="middle" className="text-[10px] font-bold fill-[#B93826]">! Conditional Prob.</text>
                    <text x="345" y="120" textAnchor="middle" className="text-[7.5px] font-mono fill-[#8C827A]">ONT-MTH-PR-024</text>
                    <rect x="295" y="124" width="100" height="12" rx="3" fill="#B93826" />
                    <text x="345" y="132.5" textAnchor="middle" className="text-[7px] font-mono font-bold fill-white tracking-wide">CRITICAL 42% WEAK</text>
                  </g>

                  {/* 6. Bayes' Theorem */}
                  <g className="cursor-pointer">
                    <rect x="475" y="75" width="110" height="42" rx="8" fill="#FCF4E6" stroke="#C07D1C" strokeWidth="1.5" />
                    <text x="530" y="92" textAnchor="middle" className="text-[10px] font-semibold fill-[#1C1917]">● Bayes' Theorem</text>
                    <text x="530" y="106" textAnchor="middle" className="text-[8px] font-mono font-bold fill-[#C07D1C]">LEARNING 64%</text>
                  </g>

                  {/* 7. Naive Bayes (LOCKED) */}
                  <g className="cursor-pointer opacity-75">
                    <rect x="600" y="95" width="75" height="42" rx="8" fill="#FAF7F2" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="2,2" />
                    <text x="637" y="112" textAnchor="middle" className="text-[9px] font-medium fill-[#78716C]">🔒 Naive Bayes</text>
                    <text x="637" y="125" textAnchor="middle" className="text-[7.5px] font-mono fill-[#A8A29E]">LOCKED</text>
                  </g>
                </svg>
              </div>

              {/* Canvas Footer Legend & Inference Strip */}
              <div className="pt-2 border-t border-[#F0ECE1] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#78716C]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D52]"></span>
                    Mastered (80–100%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#C07D1C]"></span>
                    Learning (50–79%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#B93826]"></span>
                    Weak (&lt;50%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#D1CCC5]"></span>
                    Locked / Unexplored
                  </span>
                </div>

                <span className="text-[#A8421E] font-semibold">
                  [⋈] Coordinator Inference: 1 Active Blocker
                </span>
              </div>
            </div>

            {/* 3 Bottom Analytics Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Card 1: Identified Bottlenecks */}
              <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
                      IDENTIFIED BOTTLENECKS
                    </span>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B93826]" />
                  </div>
                  <div className="text-sm font-bold text-[#1C1917] mt-1.5">
                    1 Critical Node
                  </div>
                  <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                    Conditional Probability blocks 3 downstream machine learning concepts.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F0ECE1]">
                  <Link to="/app/tutor?mode=remediation" className="text-xs font-mono font-semibold text-[#A8421E] hover:underline flex items-center gap-1">
                    <span>View remediation pipeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Velocity to Target */}
              <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
                      VELOCITY TO TARGET
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-[#2E7D52]" />
                  </div>
                  <div className="text-sm font-bold font-mono text-[#2E7D52] mt-1.5">
                    +14% / Week
                  </div>
                  <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                    Linear algebra modules completed 2.4 days ahead of scheduled pacing.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F0ECE1] text-[11px] font-mono text-[#2E7D52] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Optimal retention curve</span>
                </div>
              </div>

              {/* Card 3: Graph Auto-Repair */}
              <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
                      GRAPH AUTO-REPAIR
                    </span>
                    <Compass className="w-3.5 h-3.5 text-[#A8421E]" />
                  </div>
                  <div className="text-sm font-bold text-[#1C1917] mt-1.5">
                    Socratic Loop Ready
                  </div>
                  <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                    Maths specialist generated 5 scaffolded remediation practice steps.
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F0ECE1] text-xs font-mono text-[#57534E] flex items-center justify-between">
                  <span>Inspect 5 prompts</span>
                  <span>⚙</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Node Diagnostic Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-5">
            
            {/* Header: Category, Title & Metrics */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
                  MATHS • PROBABILITY THEORY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FDF0ED] text-[#B93826] font-bold border border-[#F7CFC2]">
                  42% WEAK
                </span>
              </div>

              <h2 className="font-serif text-xl font-normal text-[#1C1917] mt-1">
                Conditional Probability
              </h2>
              <div className="text-[11px] font-mono text-[#8C827A] mt-0.5">
                ID: ONT-MTH-PR-024 • <strong className="text-[#B93826]">Blocking 3 nodes</strong>
              </div>

              {/* 3 Quick Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F0ECE1] text-center font-mono">
                <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EAE5DC]">
                  <div className="text-[9px] text-[#8C827A] uppercase">Attempts</div>
                  <div className="text-xs font-bold text-[#1C1917] mt-0.5">7 Sets</div>
                </div>
                <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EAE5DC]">
                  <div className="text-[9px] text-[#8C827A] uppercase">Accuracy</div>
                  <div className="text-xs font-bold text-[#B93826] mt-0.5">3/8 (37.5%)</div>
                </div>
                <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EAE5DC]">
                  <div className="text-[9px] text-[#8C827A] uppercase">Last Tested</div>
                  <div className="text-xs font-bold text-[#1C1917] mt-0.5">2d ago</div>
                </div>
              </div>
            </div>

            {/* Cognitive Misconception Detection */}
            <div className="p-3.5 rounded-xl bg-[#FDF4F0] border border-[#F5C7B8] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-bold text-[#A8421E] flex items-center gap-1">
                  🧠 Cognitive Misconception Detected
                </span>
                <span className="text-[#B93826]">96.2% Conf.</span>
              </div>
              <p className="text-xs italic text-[#57534E] leading-relaxed">
                "Confusing Prior P(A) with Posterior P(A|B) under independent conditioning. Incorrectly assumes symmetry P(A|B) = P(B|A)."
              </p>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8C827A] pt-1">
                <span>Flagged by Maths Specialist Agent</span>
                <span className="text-[#A8421E] cursor-pointer hover:underline">Inspect Log</span>
              </div>
            </div>

            {/* Prerequisite Dependency Chain */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-2">
                PREREQUISITE DEPENDENCY CHAIN
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="p-2 rounded-lg bg-[#EAF4EE] text-[#2E7D52] border border-[#CDE5D5] flex items-center justify-between">
                  <span>✓ Basic Probability A)</span>
                  <span className="font-bold">89% Mastered</span>
                </div>
                <div className="p-2 rounded-lg bg-[#FDF0ED] text-[#B93826] border border-[#F7CFC2] flex items-center justify-between">
                  <span>⚠ Blocks: Bayes' Theorem</span>
                  <span className="font-bold">64% Learning</span>
                </div>
                <div className="p-2 rounded-lg bg-[#FDF0ED] text-[#B93826] border border-[#F7CFC2] flex items-center justify-between">
                  <span>⚠ Blocks: Naive Bayes</span>
                  <span className="font-bold">Gated (67%)</span>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] text-[#8C827A] border border-[#EAE5DC] flex items-center justify-between opacity-75">
                  <span>🔒 Blocks: Hidden Markov</span>
                  <span>L3 Gated</span>
                </div>
              </div>
            </div>

            {/* Adaptive Action Plan Box */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#A8421E] uppercase tracking-wider">
                  ADAPTIVE ACTION PLAN
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FCE8E1] text-[#A8421E] font-semibold">
                  12 MIN
                </span>
              </div>
              <p className="text-xs text-[#57534E]">
                Take 5 targeted practice questions with Socratic hints before attempting full Bayes derivation.
              </p>

              <div className="space-y-2 pt-1">
                <Link
                  to="/app/tutor?mode=drill&node=14"
                  className="w-full py-2.5 px-3 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Prerequisite Repair (12 min)</span>
                </Link>
                <Link
                  to="/app/tutor?agent=maths&explain=cond_prob"
                  className="w-full py-2 px-3 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#57534E] border border-[#EAE5DC] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Maths Agent to Explain</span>
                </Link>
              </div>
            </div>

            {/* Visual Intuition Sample Space Venn Box */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#EAE5DC] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8C827A]">
                <span>VISUAL INTUITION: SAMPLE SPACE P(A|B)</span>
                <span className="text-[#1C1917] font-bold">B = 66%</span>
              </div>

              {/* Mini Interactive Venn Diagram SVG */}
              <div className="p-2 bg-white rounded-lg border border-[#EAE5DC] flex justify-center">
                <svg viewBox="0 0 200 80" className="w-full max-w-[180px]">
                  {/* Circle A */}
                  <circle cx="75" cy="40" r="30" fill="#EAE5DC" fillOpacity="0.4" stroke="#8C827A" strokeWidth="1" />
                  <text x="60" y="44" className="text-[10px] font-mono fill-[#57534E]">A</text>

                  {/* Circle B (Conditioned region highlighted) */}
                  <circle cx="125" cy="40" r="30" fill="#FCE8E1" fillOpacity="0.7" stroke="#A8421E" strokeWidth="1.5" />
                  <text x="140" y="44" className="text-[10px] font-mono font-bold fill-[#A8421E]">B</text>

                  {/* Overlap A ∩ B */}
                  <path d="M 100,16 C 109,24 109,56 100,64 C 91,56 91,24 100,16 Z" fill="#A8421E" fillOpacity="0.8" />
                  <text x="100" y="43" textAnchor="middle" className="text-[8px] font-mono font-bold fill-white">A∩B</text>
                </svg>
              </div>

              <div className="text-[10px] font-mono text-[#78716C] flex items-center justify-between">
                <span>Restrict Sample Space to B</span>
                <span className="text-[#A8421E] font-semibold">P(A|B) = P(A∩B)/P(B)</span>
              </div>
            </div>

            {/* Mentor Footer */}
            <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C1917] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                  AT
                </span>
                <div>
                  <div className="text-xs font-semibold text-[#1C1917]">Prof. Aris Thorne</div>
                  <div className="text-[10px] text-[#8C827A]">CS Department • Curriculum</div>
                </div>
              </div>
              <button className="text-[11px] font-mono text-[#A8421E] hover:underline font-semibold">
                View Notes
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
