import React from 'react';
import { Radio, RefreshCw } from 'lucide-react';
import { useTrace } from '../../hooks/useStudent';
import { AGENT_STYLES } from '../../services/api';

/**
 * Live routing telemetry — every coordinator decision, newest first,
 * straight from the agent_routing_log table.
 *
 * This is the audit trail behind the Agent Trace panel: it shows not just
 * which agent answered, but the trained router's confidence and whether it
 * had to fall back to the LLM classifier.
 */
export default function LiveTelemetryStream({ studentId, limit = 12 }) {
  const { entries, loading, error, refresh } = useTrace(studentId, limit);

  return (
    <div className="rounded-xl border border-[#EAE5DC] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-[#A8421E]" />
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#57534E]">
            Routing Telemetry
          </h3>
        </div>
        <button
          onClick={refresh}
          className="rounded p-1 text-[#8C827A] transition-colors hover:bg-[#FAF7F2] hover:text-[#1C1917]"
          title="Refresh"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="mt-3 font-sans text-[11px] text-red-600">{error}</p>}

      {!error && entries.length === 0 && !loading && (
        <p className="mt-3 font-sans text-[11px] text-[#8C827A]">
          No routing events yet. Ask the tutor something.
        </p>
      )}

      <div className="mt-3 space-y-2.5">
        {entries.map((e) => {
          const style = AGENT_STYLES[e.agent] || AGENT_STYLES.general;
          const pct = Math.round((e.confidence || 0) * 100);
          return (
            <div key={e.id} className="border-l-2 pl-2.5" style={{ borderColor: style.color }}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase"
                  style={{ background: style.bg, color: style.color }}
                >
                  {style.label}
                </span>
                <span className="font-mono text-[10px] text-[#57534E]">
                  {pct}%
                  {e.used_llm_fallback && (
                    <span className="ml-1 text-[#C07D1C]" title="Fell back to the LLM classifier">
                      ↷LLM
                    </span>
                  )}
                </span>
              </div>
              {e.message && (
                <p className="mt-1 truncate font-sans text-[11px] text-[#1C1917]">{e.message}</p>
              )}
              <p className="mt-0.5 font-mono text-[9px] leading-snug text-[#8C827A]">
                {e.routed_reason}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
