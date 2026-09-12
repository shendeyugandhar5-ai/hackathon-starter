import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Cpu, Plus, AlertTriangle } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import ChatThread from '../components/tutor/ChatThread';
import AgentTracePanel from '../components/tutor/AgentTracePanel';
import Composer from '../components/tutor/Composer';
import KnowledgeCheckCard from '../components/tutor/KnowledgeCheckCard';
import { useChat, useBackendHealth } from '../hooks/useChat';
import { useStudentId } from '../hooks/useStudentId';
import { useRootCause } from '../hooks/useStudent';

/**
 * Live tutoring workspace.
 *
 * Every question goes to POST /api/chat, where the coordinator routes it to
 * a specialist. The Agent Trace panel on the right renders the routing
 * metadata that comes back, so the orchestration is visible rather than
 * something the user has to take on faith.
 */
export default function Tutor() {
  const { setSidebarOpen } = useOutletContext();
  const studentId = useStudentId();

  const {
    messages,
    sending,
    error,
    lastTrace,
    send,
    startNewConversation,
    loadConversation,
    conversationId,
  } = useChat(studentId);

  const { online, database } = useBackendHealth(30000);
  const { topGap, refresh: refreshRootCause } = useRootCause(studentId);

  // Resume a thread when opened from History (/app/tutor?conversation=<id>)
  // or prefill agent if /app/tutor?agent=maths
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeId = searchParams.get('conversation');
  const agentParam = searchParams.get('agent');
  const [prefillText, setPrefillText] = useState('');

  useEffect(() => {
    if (resumeId) {
      loadConversation(resumeId);
      setSearchParams({}, { replace: true });
    }
  }, [resumeId, loadConversation, setSearchParams]);

  useEffect(() => {
    if (agentParam) {
      setPrefillText(`@${agentParam} `);
      setSearchParams({}, { replace: true });
    }
  }, [agentParam, setSearchParams]);

  // Prompts that exercise each routing path — handy during a demo
  const suggestedPrompts = [
    'Why does my recursion code run forever?',
    'Explain Bayes theorem with an example',
    'Why does gradient descent use calculus, and how would I implement it?',
    'I have 2 months before placements — what should I focus on?',
  ];

  const handlePrompt = async (prompt) => {
    if (sending) return;
    await send(prompt);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16 flex flex-col">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-6 space-y-5 flex-1 flex flex-col">
        {/* Workspace context bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-[#EAE5DC]">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8C827A]">
            <span className="p-1 rounded bg-[#FDF4F0] text-[#A8421E]">
              <Cpu className="w-3 h-3" />
            </span>
            <span>
              WORKSPACE • <strong className="text-[#1C1917]">{studentId}</strong>
            </span>
            {conversationId && (
              <>
                <span>/</span>
                <span className="text-[#A8421E] font-semibold">
                  thread {conversationId.slice(0, 8)}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold border ${
                online
                  ? 'bg-[#FAF7F2] text-[#1C6B5A] border-[#E7E2D7]'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  online ? 'bg-[#1C6B5A] animate-pulse' : 'bg-red-500'
                }`}
              />
              {online === null ? 'Connecting' : online ? `Online · db ${database || 'ready'}` : 'Backend offline'}
            </span>

            <button
              onClick={startNewConversation}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE0] text-[#57534E] font-mono text-[10px] border border-[#E7E2D7] transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New thread
            </button>

            <Link
              to="/app/knowledge-map"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE0] text-[#57534E] font-mono text-[10px] border border-[#E7E2D7] transition-colors"
            >
              Collaboration Graph
            </Link>

            <Link
              to="/app/student-brain"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE0] text-[#57534E] font-mono text-[10px] border border-[#E7E2D7] transition-colors"
            >
              Diagnostic Mode •
            </Link>
          </div>
        </div>

        {/* Backend unreachable banner */}
        {online === false && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="font-sans text-xs font-bold text-red-800">Backend not reachable</p>
              <p className="mt-0.5 font-sans text-[11px] text-red-700">
                Start it with{' '}
                <code className="font-mono">uvicorn app.main:app --reload --port 8000</code> from
                the <code className="font-mono">backend/</code> folder.
              </p>
            </div>
          </div>
        )}

        {/* Root-cause callout */}
        {topGap && (
          <div className="rounded-xl border border-[#C07D1C]/30 bg-[#FCF4E6] px-4 py-2.5">
            <p className="font-sans text-[11px] text-[#57534E]">
              <span className="font-bold text-[#C07D1C]">Root cause detected:</span>{' '}
              <strong>{topGap.prerequisite}</strong> ({Math.round(topGap.score * 100)}%) is gating{' '}
              <strong>{topGap.blocks}</strong> ({Math.round(topGap.blocked_score * 100)}%).
            </p>
          </div>
        )}

        {/* Chat + trace */}
        <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* Conversation */}
          <div className="flex min-h-[460px] flex-col rounded-xl border border-[#EAE5DC] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <ChatThread
              messages={messages}
              sending={sending}
              emptyState={
                <div className="text-center">
                  <Sparkles className="mx-auto h-7 w-7 text-[#A8421E]" />
                  <h2 className="mt-3 font-sans text-base font-bold text-[#1C1917]">
                    Ask anything across DSA, DBMS, Maths or AIML
                  </h2>
                  <p className="mx-auto mt-1 max-w-md font-sans text-xs text-[#8C827A]">
                    The coordinator picks the right specialist and shows you why.
                  </p>
                  <div className="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2">
                    {suggestedPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePrompt(p)}
                        className="rounded-full border border-[#E7E2D7] bg-[#FAF7F2] px-3 py-1.5 font-sans text-[11px] text-[#57534E] transition-colors hover:bg-[#F2ECE0] cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />

            {/* Knowledge check, when the coordinator generated one */}
            {lastTrace?.knowledgeCheck && (
              <div className="border-t border-[#EAE5DC] p-3">
                <KnowledgeCheckCard
                  check={lastTrace.knowledgeCheck}
                  studentId={studentId}
                  onGraded={() => refreshRootCause()}
                />
              </div>
            )}

            {/* Composer: type, speak, or attach an image */}
            <Composer onSend={send} sending={sending} error={error} initialText={prefillText} />
          </div>

          {/* Agent Trace */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <AgentTracePanel trace={lastTrace} sending={sending} />
          </div>
        </div>
      </div>
    </div>
  );
}
