import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { History as HistoryIcon, Clock, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import TelemetryStream from '../components/brain/TelemetryStream';

export default function History() {
  const { setSidebarOpen } = useOutletContext();

  const sessions = [
    {
      id: 'ses-102',
      title: 'Bayes Theorem & Marginal Independence Diagnostic',
      date: 'Today, 14:20',
      duration: '18 mins',
      agents: ['Maths Agent', 'Coordinator'],
      outcome: 'Prerequisite Blocker Identified',
      score: '42% Cond. Prob'
    },
    {
      id: 'ses-101',
      title: 'Advanced SQL Window Functions & Index Execution',
      date: '2 days ago',
      duration: '25 mins',
      agents: ['DBMS Agent'],
      outcome: 'Concept Mastered',
      score: '92% Mastery'
    },
    {
      id: 'ses-100',
      title: 'Dynamic Programming Subproblems (Knapsack)',
      date: '3 days ago',
      duration: '32 mins',
      agents: ['DSA Agent'],
      outcome: 'Verified Worked Calculation',
      score: '86% Mastery'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
            ACADEMIC LOGS & DIAGNOSTIC ARCHIVE
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#1C1917]">
            Session History
          </h1>
          <p className="text-xs text-[#57534E] mt-1">
            Complete audit trail of Socratic tutorials, diagnostic checkpoints, and belief score updates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {sessions.map((ses) => (
              <div 
                key={ses.id}
                className="p-5 bg-white rounded-xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#D4CCBE] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#A8421E]">{ses.id}</span>
                    <span className="text-[10px] font-mono text-[#8C827A]">• {ses.date} ({ses.duration})</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#1C1917] mt-1">{ses.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ses.agents.map((ag) => (
                      <span key={ag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#57534E] border border-[#E7E2D7]">
                        {ag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-[#1C1917]">{ses.score}</div>
                  <div className="text-[10px] text-[#2E7D52] font-semibold mt-0.5">{ses.outcome}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <TelemetryStream />
          </div>
        </div>
      </div>
    </div>
  );
}
