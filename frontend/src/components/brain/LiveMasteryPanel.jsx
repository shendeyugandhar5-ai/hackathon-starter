import React from 'react';
import { AGENT_STYLES, STATE_STYLES } from '../../services/api';

/**
 * Live Student Brain data — per-subject rollup and per-topic mastery,
 * read from GET /api/students/{id}/mastery.
 *
 * Scores come from the Progress Engine (BKT by default, DKT-LSTM once a
 * student has enough interaction history), so this updates as soon as an
 * assessment is submitted.
 */
export default function LiveMasteryPanel({ subjects, topics, overallPercent, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-[#F2ECE0]" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-[#FAF7F2]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-sans text-xs font-bold text-red-800">Could not load mastery data</p>
        <p className="mt-1 font-sans text-[11px] text-red-700">{error}</p>
      </div>
    );
  }

  if (!topics.length) {
    return (
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-5">
        <p className="font-sans text-xs font-bold text-[#1C1917]">No mastery data yet</p>
        <p className="mt-1 font-sans text-[11px] text-[#8C827A]">
          Ask the tutor a question or answer a knowledge check to start building your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall */}
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#57534E]">
            Overall Mastery
          </h3>
          <span className="font-mono text-2xl font-bold text-[#1C1917]">{overallPercent}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F2ECE0]">
          <div
            className="h-full rounded-full bg-[#A8421E] transition-all duration-700"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-[#8C827A]">
          {topics.length} topics tracked across {subjects.length} subjects · BKT-updated
        </p>
      </div>

      {/* Per-subject */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {subjects.map((s) => {
          const style = AGENT_STYLES[s.subject] || AGENT_STYLES.general;
          const pct = Math.round(s.average_score * 100);
          return (
            <div key={s.subject} className="rounded-xl border border-[#EAE5DC] bg-white p-4">
              <div className="flex items-center justify-between">
                <span
                  className="rounded-md px-2 py-0.5 font-sans text-[10px] font-bold uppercase"
                  style={{ background: style.bg, color: style.color }}
                >
                  {style.label}
                </span>
                <span className="font-mono text-sm font-bold text-[#1C1917]">{pct}%</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#F2ECE0]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: style.color }}
                />
              </div>
              <p className="mt-2 font-sans text-[10px] text-[#8C827A]">
                {s.topic_count} topics
                {s.weak_topics.length > 0 && (
                  <span className="text-[#B93826]"> · {s.weak_topics.length} weak</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Per-topic */}
      <div className="rounded-xl border border-[#EAE5DC] bg-white p-5">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#57534E]">
          Topic Breakdown
        </h3>
        <div className="mt-3 space-y-2">
          {topics.map((t) => {
            const state = STATE_STYLES[t.state] || STATE_STYLES.new;
            const pct = Math.round(t.score * 100);
            return (
              <div key={`${t.subject}-${t.topic}`} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate font-sans text-xs text-[#1C1917]">
                  {t.topic.replace(/_/g, ' ')}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F2ECE0]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: state.color }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-[11px] text-[#57534E]">
                  {pct}%
                </span>
                <span
                  className="w-20 shrink-0 rounded-md px-1.5 py-0.5 text-center font-sans text-[9px] font-bold uppercase"
                  style={{ background: state.bg, color: state.color }}
                >
                  {state.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
