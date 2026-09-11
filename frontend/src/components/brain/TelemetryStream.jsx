import React from 'react';
import { Radio } from 'lucide-react';
import { telemetryEvents } from '../../data/mockData';

export default function TelemetryStream({ events }) {
  const displayEvents = (events && events.length > 0) ? events : telemetryEvents;

  return (
    <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-[#A8421E]" />
          <h3 className="font-semibold text-sm text-[#1C1917]">
            Telemetry Delta Stream
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#78716C] border border-[#E7E2D7]">
          Live Audit
        </span>
      </div>

      <p className="text-[11px] text-[#78716C] mt-2 leading-relaxed">
        Bayesian belief update log generated across active sessions and diagnostic checkpoints.
      </p>

      {/* Events List */}
      <div className="mt-4 space-y-3 flex-1">
        {displayEvents.map((evt) => (
          <div 
            key={evt.id}
            className="p-3 rounded-lg bg-[#FAF7F2] border border-[#EAE5DC] hover:border-[#DDD5C5] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${evt.dotColor || 'bg-[#A8421E]'}`}></span>
                <span className="text-xs font-semibold text-[#1C1917]">
                  {evt.title || evt.message || 'Telemetry Event'}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${evt.deltaColor || 'bg-[#EAF4EE] text-[#2E7D52] border-[#CDE5D5]'}`}>
                {evt.delta || (evt.confidence ? `${Math.round(evt.confidence * 100)}% Conf` : '+4.2%')}
              </span>
            </div>

            <p className="text-[11px] text-[#57534E] mt-1 pl-4 leading-normal">
              {evt.description || evt.routed_reason || 'Multi-agent knowledge routing update.'}
            </p>

            <div className="mt-2 pl-4 flex items-center justify-between text-[10px] font-mono text-[#8C827A]">
              <span>{evt.timestamp || (evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent')}</span>
              <span className="text-[#A8421E] font-medium">• {evt.agent ? (evt.agent.includes('Agent') ? evt.agent : `${evt.agent.toUpperCase()} Agent`) : 'Coordinator'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
