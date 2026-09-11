<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Clock, CheckCircle, ArrowRight, FileText, Bot, MessageSquare } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import TelemetryStream from '../components/brain/TelemetryStream';
import { useAuth } from '../context/AuthContext';
import { historyService } from '../services/historyService';

export default function History() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();
  const { profile, user } = useAuth();
  const studentId = profile?.auth_user_id || profile?.id || user?.id || 'rahul';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadHistory() {
      try {
        const res = await historyService.getStudentHistory(studentId);
        if (mounted && res.sessions) {
          setSessions(res.sessions);
        }
      } catch (err) {
        console.error('Failed to load student session history:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadHistory();
    return () => {
      mounted = false;
    };
  }, [studentId]);
=======
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
>>>>>>> 7a83365997f7d8fa8cbcfd7b32a7d5b25feae5d7

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
<<<<<<< HEAD
            {sessions.length === 0 && !loading ? (
              <div className="p-8 bg-white rounded-xl border border-[#EAE5DC] text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-[#8C827A] mx-auto opacity-50" />
                <h3 className="font-semibold text-sm text-[#1C1917]">No learning sessions recorded yet</h3>
                <p className="text-xs text-[#57534E] max-w-sm mx-auto">
                  Start your first conversation with EduHive to build your Socratic history and audit trail.
                </p>
                <Link
                  to="/app/tutor"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A8421E] text-white text-xs font-semibold shadow-xs"
                >
                  <span>Start a Tutorial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              sessions.map((ses) => (
                <div 
                  key={ses.id}
                  onClick={() => navigate('/app/tutor')}
                  className="p-5 bg-white rounded-xl border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#D4CCBE] hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#A8421E]">{ses.id}</span>
                      <span className="text-[10px] font-mono text-[#8C827A]">• {ses.date} ({ses.duration})</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#1C1917] mt-1 group-hover:text-[#A8421E] transition-colors">
                      {ses.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ses.agents.map((ag) => (
                        <span key={ag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#57534E] border border-[#E7E2D7]">
                          {ag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                    <div className="text-xs font-mono font-bold text-[#1C1917]">{ses.score}</div>
                    <div className="text-[10px] text-[#2E7D52] font-semibold">{ses.outcome}</div>
                  </div>
                </div>
              ))
            )}
=======
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
>>>>>>> 7a83365997f7d8fa8cbcfd7b32a7d5b25feae5d7
          </div>

          <div className="lg:col-span-4">
            <TelemetryStream />
          </div>
        </div>
      </div>
    </div>
  );
}
