import React from 'react';
import { AGENT_STYLES } from '../../services/api';

/**
 * Agent Trace panel — the explainability surface.
 *
 * Every row below is a real event emitted by the backend orchestration
 * graph during this turn. Nothing here is hardcoded: steps the coordinator
 * chose to skip render as skipped, and failures render as failed, so what
 * the panel shows is exactly what executed.
 */

/** Compact strategy labels; the backend sends snake_case identifiers. */
const STRATEGY_LABELS = {
  step_by_step: 'Step-by-step',
  worked_example: 'Worked example',
  analogy: 'Analogy',
  challenge: 'Challenge-first',
  coding_example: 'Coding example',
  hint: 'Hint',
  socratic: 'Socratic',
  visual: 'Visual',
  quiz_first: 'Quiz-first',
  exam_revision: 'Exam revision',
};

const STATUS_MARK = {
  ok: { icon: '✓', color: '#1C6B5A' },
  skipped: { icon: '−', color: '#8C827A' },
  failed: { icon: '!', color: '#B93826' },
};

function TraceRow({ event }) {
  const mark = STATUS_MARK[event.status] || STATUS_MARK.ok;
  const muted = event.status === 'skipped';

  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-[1px] w-3 shrink-0 text-center font-mono text-[11px] font-bold"
        style={{ color: mark.color }}
      >
        {mark.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`font-sans text-[11px] font-semibold ${
              muted ? 'text-[#8C827A]' : 'text-[#1C1917]'
            }`}
          >
            {event.label}
          </span>
          {event.confidence != null && (
            <span className="shrink-0 font-mono text-[10px] text-[#57534E]">
              {Math.round(event.confidence * 100)}%
            </span>
          )}
        </div>
        {event.detail && (
          <p className="mt-0.5 font-sans text-[10px] leading-snug text-[#8C827A]">
            {event.detail}
          </p>
        )}
      </div>
    </li>
  );
}

export default function AgentTracePanel({ trace, sending }) {
  if (!trace && !sending) {
    return (
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-4">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#57534E]">
          Agent Trace
        </h3>
        <p className="mt-2 font-sans text-xs text-[#8C827A]">
          Ask a question to see how the hive routes, grounds, and verifies it.
        </p>
      </div>
    );
  }

  if (sending && !trace) {
    return (
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-4">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#57534E]">
          Agent Trace
        </h3>
        <p className="mt-2 animate-pulse font-sans text-xs text-[#57534E]">
          Orchestrating…
        </p>
      </div>
    );
  }

  const style = AGENT_STYLES[trace.agent] || AGENT_STYLES.general;
  const confidencePct = Math.round((trace.confidence || 0) * 100);
  const events = trace.events || [];
  const supporting = trace.supportingAgents || [];
  const retrieved = trace.retrievedContext || [];
  const strategy = trace.teachingStrategy;
  const verification = trace.verification;

  return (
    <div className="space-y-3">
      {/* Routed agent */}
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#57534E]">
            Agent Trace
          </h3>
          {trace.latencyMs != null && (
            <span className="font-mono text-[10px] text-[#8C827A]">{trace.latencyMs}ms</span>
          )}
        </div>

        <div className="mt-3 rounded-lg p-3" style={{ background: style.bg }}>
          <div className="flex items-center justify-between">
            <span className="font-sans text-sm font-bold" style={{ color: style.color }}>
              {style.label} Agent
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: style.color }}>
              {confidencePct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${confidencePct}%`, background: style.color }}
            />
          </div>

          {supporting.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="font-sans text-[10px] text-[#57534E]">supported by</span>
              {supporting.map((name) => {
                const s = AGENT_STYLES[name] || AGENT_STYLES.general;
                return (
                  <span
                    key={name}
                    className="rounded px-1.5 py-0.5 font-sans text-[10px] font-bold"
                    style={{ background: '#FFFFFF', color: s.color }}
                  >
                    {s.label}
                  </span>
                );
              })}
            </div>
          )}

          {strategy && (
            <p className="mt-2 font-sans text-[10px] text-[#57534E]">
              Teaching strategy:{' '}
              <span className="font-bold">{STRATEGY_LABELS[strategy] || strategy}</span>
            </p>
          )}
        </div>
      </div>

      {/* Execution steps */}
      {events.length > 0 && (
        <div className="rounded-xl border border-[#EAE5DC] bg-white p-4">
          <h4 className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
            Execution
          </h4>
          <ol className="mt-2.5 space-y-2">
            {events.map((e, i) => (
              <TraceRow key={`${e.step}-${i}`} event={e} />
            ))}
          </ol>
        </div>
      )}

      {/* Grounding */}
      {retrieved.length > 0 && (
        <div className="rounded-xl border border-[#EAE5DC] bg-white p-4">
          <h4 className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
            Grounded on
          </h4>
          <ul className="mt-2 space-y-1.5">
            {retrieved.map((c) => {
              const s = AGENT_STYLES[c.subject] || AGENT_STYLES.general;
              return (
                <li key={`${c.subject}-${c.topic}`} className="flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[11px] text-[#1C1917]">
                    {c.topic.replace(/_/g, ' ')}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] text-[#8C827A]">
                    {c.score.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Verification verdict */}
      {verification && verification.status === 'ok' && (
        <div
          className={`rounded-xl border p-3 ${
            verification.passed
              ? 'border-[#1C6B5A]/30 bg-[#E9F5F1]'
              : 'border-[#B93826]/30 bg-[#FDF0ED]'
          }`}
        >
          <p
            className="font-sans text-[10px] font-bold uppercase tracking-wider"
            style={{ color: verification.passed ? '#1C6B5A' : '#B93826' }}
          >
            {verification.passed ? 'Verified' : 'Verification failed — corrected'}
          </p>
          {verification.confidence != null && (
            <p className="mt-0.5 font-mono text-[10px] text-[#57534E]">
              confidence {verification.confidence.toFixed(2)}
            </p>
          )}
          {verification.issues?.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {verification.issues.map((issue) => (
                <li key={issue} className="font-sans text-[10px] text-[#57534E]">
                  • {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Next best action */}
      {trace.recommendation && (
        <div className="rounded-xl border border-[#C07D1C]/30 bg-[#FCF4E6] p-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#C07D1C]">
            Next best action
          </p>
          <p className="mt-1 font-sans text-xs font-bold text-[#1C1917]">
            {trace.recommendation.topic.replace(/_/g, ' ')}
          </p>
          <p className="mt-0.5 font-sans text-[11px] leading-snug text-[#57534E]">
            {trace.recommendation.reason}
          </p>
        </div>
      )}
    </div>
  );
}
