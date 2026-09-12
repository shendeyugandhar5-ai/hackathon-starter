import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Bot, 
  Cpu, 
  Code2, 
  Database, 
  Sigma, 
  Sparkles, 
  BrainCircuit, 
  ArrowRight, 
  ShieldCheck, 
  Layers,
  Radio,
  CheckCircle2
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAgents, useTrace } from '../hooks/useStudent';
import { useStudentId } from '../hooks/useStudentId';

export default function Agents() {
  const { setSidebarOpen } = useOutletContext();

  // Live agent roster + how often each has actually been routed to
  const studentId = useStudentId();
  const { agents: liveAgents } = useAgents();
  const { entries } = useTrace(studentId, 100);

  const routeCounts = entries.reduce((acc, e) => {
    acc[e.agent] = (acc[e.agent] || 0) + 1;
    return acc;
  }, {});

  // Average confidence the trained router gave each agent, from real traffic
  const avgConfidence = entries.reduce((acc, e) => {
    if (e.confidence == null) return acc;
    const prev = acc[e.agent] || { sum: 0, n: 0 };
    acc[e.agent] = { sum: prev.sum + e.confidence, n: prev.n + 1 };
    return acc;
  }, {});

  /** Scope text from GET /api/agents, keyed by backend agent name. */
  const liveScope = Object.fromEntries(liveAgents.map((a) => [a.name, a.scope]));

  const agentDetails = [
    {
      id: 'coord',
      name: 'Coordinator Agent',
      handle: '@Coord_Agent',
      role: 'Bayesian Knowledge Tracing & Pedagogical Orchestrator',
      status: 'Active',
      color: '#A8421E',
      bg: '#FDF4F0',
      activeTopics: ['Bayesian Knowledge Tracing', 'Cross-Domain Prerequisite Detection', 'Consensus Synthesis'],
      confidence: '98.4%',
      description: 'Maintains your unified student cognitive model, identifies prerequisite blockers across mathematics and engineering, and dynamically dispatches subject specialists.'
    },
    {
      id: 'maths',
      name: 'Mathematics Specialist',
      handle: '@Maths_Tutor',
      role: 'Linear Algebra, Probability Theory & Vector Calculus',
      status: 'Active',
      color: '#B93826',
      bg: '#FDF0ED',
      activeTopics: ['Conditional Probability', 'Bayes Rule Formulations', 'Eigenvalue Decomposition'],
      confidence: '95.0%',
      description: 'Provides rigorous mathematical grounding, proofs, derivations, and addresses foundational conceptual misconceptions.'
    },
    {
      id: 'aiml',
      name: 'AI & Machine Learning Specialist',
      handle: '@AIML_Tutor',
      role: 'Loss Surfaces, Neural Architectures & Optimization',
      status: 'Active',
      color: '#DF7356',
      bg: '#FDF2EE',
      activeTopics: ['Naive Bayes Classifiers', 'Gradient Descent Geometry', 'Loss Formulations'],
      confidence: '87.2%',
      description: 'Bridges theoretical proofs directly to practical model architectures, classification algorithms, and hyperparameter intuition.'
    },
    {
      id: 'dsa',
      name: 'DSA Specialist',
      handle: '@DSA_Tutor',
      role: 'Algorithms, Asymptotic Complexity & Dynamic Programming',
      status: 'Active',
      color: '#C07D1C',
      bg: '#FCF4E6',
      activeTopics: ['Dynamic Programming Subproblems', 'Graph Traversals (BFS/DFS)', 'Sliding Window Optimization'],
      confidence: '91.8%',
      description: 'Drills algorithmic intuition, space-time complexity analysis, and recursive subproblem decomposition.'
    },
    {
      id: 'dbms',
      name: 'DBMS Specialist',
      handle: '@DBMS_Tutor',
      role: 'Query Execution, Indexing Structures & Transaction Models',
      status: 'Active',
      color: '#3B7A8C',
      bg: '#EEF6F8',
      activeTopics: ['B+ Tree Index Optimization', 'Multi-Table SQL Joins & Windowing', 'Storage Engine Architecture'],
      confidence: '94.5%',
      description: 'Optimizes query plans, explains disk I/O caching trade-offs, and analyzes vector storage indexing systems.'
    },
    {
      id: 'general',
      name: 'General Strategy & Pedagogy',
      handle: '@General_Strat',
      role: 'Cognitive Load Balancing & Socratic Grounding',
      status: 'Active',
      color: '#57534E',
      bg: '#F5F5F4',
      activeTopics: ['Dual Coding Metacognition', 'Socratic Question Generation', 'Working Memory Allocation'],
      confidence: '99.0%',
      description: 'Monitors cognitive load indices to ensure explanations adapt dynamically between high scaffolding and concise drills.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
              AI TUTOR FACULTY & TELEMETRY MESH
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#1C1917] tracking-tight">
              Specialist AI Tutors
            </h1>
            <p className="mt-1 text-xs md:text-sm text-[#57534E] max-w-2xl leading-relaxed">
              Explore your dedicated multi-agent academic faculty. Each specialist continuously monitors prerequisite depth and coordinates in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4EE] text-[#2E7D52] font-mono text-xs font-semibold border border-[#CDE5D5]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D52] animate-pulse"></span>
              6 Specialists Active
            </span>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agentDetails.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-xl p-6 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#D4CCBE] transition-all duration-150"
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[#F0ECE1]">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-2xs"
                      style={{ backgroundColor: agent.bg, color: agent.color }}
                    >
                      {agent.id.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1C1917]">{agent.name}</h3>
                      <span className="text-[11px] font-mono text-[#8C827A]">{agent.handle}</span>
                    </div>
                  </div>

                  {/* Live: mean router confidence and how often this agent was chosen */}
                  {avgConfidence[agent.id] ? (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] font-semibold border border-[#CDE5D5]"
                      title={`Routed to ${routeCounts[agent.id]} time(s)`}
                    >
                      {Math.round(
                        (avgConfidence[agent.id].sum / avgConfidence[agent.id].n) * 100
                      )}
                      % · {routeCounts[agent.id]}×
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#8C827A] font-semibold border border-[#E7E2D7]">
                      idle
                    </span>
                  )}
                </div>

                <div className="text-xs font-medium text-[#A8421E] mt-3">
                  {agent.role}
                </div>

                <p className="text-xs text-[#57534E] mt-2 leading-relaxed">
                  {liveScope[agent.id] || agent.description}
                </p>

                {/* Active Topics */}
                <div className="mt-4 pt-3 border-t border-[#F0ECE1]">
                  <div className="text-[9.5px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-2">
                    ACTIVE TELEMETRY TOPICS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.activeTopics.map((topic) => (
                      <span 
                        key={topic}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F5] text-[#57534E] border border-[#EAE5DC]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="mt-5 pt-3 border-t border-[#F0ECE1]">
                <Link
                  to={`/app/tutor?agent=${agent.id}`}
                  className="w-full py-2 px-3 rounded-lg bg-[#FAF8F5] hover:bg-[#F2ECE0] text-[#1C1917] border border-[#EAE5DC] text-xs font-mono font-semibold flex items-center justify-between transition-colors group"
                >
                  <span>Launch Socratic Session</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A8421E] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
