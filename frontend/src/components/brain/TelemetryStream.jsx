import React from 'react';
import { Radio } from 'lucide-react';

export default function TelemetryStream({ events = [] }) {
  return <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col h-full">
    <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]"><div className="flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-[#A8421E]" /><h3 className="font-semibold text-sm">Telemetry Delta Stream</h3></div><span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#78716C] border border-[#E7E2D7]">Live Audit</span></div>
    <p className="text-[11px] text-[#78716C] mt-2">Routing decisions recorded for this student only.</p>
    <div className="mt-4 space-y-3 flex-1">
      {!events.length ? <div className="h-full min-h-32 flex items-center justify-center text-center text-xs text-[#8C827A] font-mono border border-dashed border-[#EAE5DC] rounded-lg">No routing activity yet.<br />Start a tutor session to populate this stream.</div> : events.map((evt) => <div key={evt.id || `${evt.created_at}-${evt.message}`} className="p-3 rounded-lg bg-[#FAF7F2] border border-[#EAE5DC]"><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0 bg-[#A8421E]" /><span className="text-xs font-semibold truncate">{evt.message || 'Telemetry Event'}</span></div><span className="text-[10px] font-mono font-bold">{evt.confidence != null ? `${Math.round(evt.confidence * 100)}%` : '—'}</span></div><p className="text-[11px] text-[#57534E] mt-1 pl-4">{evt.routed_reason || 'Routing decision recorded.'}</p><div className="mt-2 pl-4 flex items-center justify-between text-[10px] font-mono text-[#8C827A]"><span>{evt.created_at ? new Date(evt.created_at).toLocaleString() : 'Recent'}</span><span>{String(evt.agent || 'general').toUpperCase()} Agent</span></div></div>)}
    </div>
  </div>;
}
