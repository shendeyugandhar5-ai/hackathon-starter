import React from 'react';
import { AGENT_STYLES } from '../../services/api';

/**
 * Agent Trace panel — makes the routing decision visible.
 *
 * Renders the live metadata returned with every chat answer: which agent
 * was chosen, the trained router's confidence, why it was chosen, which
 * agents collaborated, and what student context shaped the answer.
 */
export default function AgentTracePanel({ trace, sending }) {
  if (!trace && !sending) {
    return (
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-4">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#57534E]">
          Agent Trace
        </h3>
        <p className="mt-2 font-sans text-xs text-[#8C827A]">
          Ask a question to see how the coordinator routes it.
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
          Routing…
        </p>
      </div>
    );
  }

  const style = AGENT_STYLES[trace.agent] || AGENT_STYLES.general;
  const confidencePct = Math.round((trace.confidence || 0) * 100);
  const collaborated = (trace.contributingAgents || []).length > 1;
  const ctx = trace.contextUsed;

  const steps = [
    'Question received',
    'Student context loaded',
    `Router classified → ${style.label}`,
    collaborated ? 'Specialists collaborated' : 'Specialist answered',
    collaborated ? 'Verifier combined answers' : null,
    'Progress + recommendation updated',
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-[#EAE5DC] bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#57534E]">
          Agent Trace
        </h3>
        {trace.latencyMs != null && (
          <span className="font-mono text-[10px] text-[#8C827A]">{trace.latencyMs}ms</span>
        )}
      </div>

      {/* Routed agent + confidence */}
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
        <p className="mt-2 font-sans text-[11px] leading-snug text-[#57534E]">
          {trace.routedReason}
        </p>
      </div>

      {/* Collaboration */}
      {collaborated && (
        <div className="mt-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
            Collaborating agents
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {trace.contributingAgents.map((name) => {
              const s = AGENT_STYLES[name] || AGENT_STYLES.general;
              return (
                <span
                  key={name}
                  className="rounded-md px-2 py-0.5 font-sans text-[10px] font-bold"
                  style={{ background: s.bg, color: s.color }}
                >
                  {s.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Shared student context that shaped the answer */}
      {ctx && (ctx.weak_topics?.length > 0 || ctx.prerequisite_gaps?.length > 0) && (
        <div className="mt-3 rounded-lg border border-[#EAE5DC] bg-[#FAF7F2] p-2.5">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
            Personalized using
          </p>
          {ctx.weak_topics?.length > 0 && (
            <p className="mt-1 font-sans text-[11px] text-[#57534E]">
              <span className="font-bold">{ctx.weak_topics.length} weak topics:</span>{' '}
              {ctx.weak_topics.slice(0, 3).join(', ')}
            </p>
          )}
          {ctx.prerequisite_gaps?.map((g) => (
            <p key={g.prerequisite} className="mt-1 font-sans text-[11px] text-[#A8421E]">
              {g.prerequisite} → blocks {g.blocks}
            </p>
          ))}
          {ctx.recent_messages > 0 && (
            <p className="mt-1 font-sans text-[10px] text-[#8C827A]">
              {ctx.recent_messages} prior turns in context
            </p>
          )}
        </div>
      )}

      {/* Workflow steps */}
      <ol className="mt-3 space-y-1">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-1.5 font-sans text-[11px] text-[#57534E]">
            <span className="mt-[1px] text-[#1C6B5A]">✓</span>
            {step}
          </li>
        ))}
      </ol>

      {/* Next best action */}
      {trace.recommendation && (
        <div className="mt-3 rounded-lg border border-[#C07D1C]/30 bg-[#FCF4E6] p-2.5">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#C07D1C]">
            Next best action
          </p>
          <p className="mt-1 font-sans text-xs font-bold text-[#1C1917]">
            {trace.recommendation.topic}
          </p>
          <p className="mt-0.5 font-sans text-[11px] leading-snug text-[#57534E]">
            {trace.recommendation.reason}
          </p>
        </div>
      )}
    </div>
  );
}
