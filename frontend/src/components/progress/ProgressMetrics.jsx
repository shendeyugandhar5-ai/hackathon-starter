import React from 'react';
import { TrendingUp, Clock, Calendar } from 'lucide-react';

export default function ProgressMetrics({ progressData }) {
  const velocity = progressData?.velocity || {};
  const focused = progressData?.focusedHours || {};
  const next = progressData?.milestones?.find((m) => m.status !== 'completed');
  const retention = progressData?.retentionRate || '0%';
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Metric title="Learning Velocity" icon={<TrendingUp className="w-3.5 h-3.5 text-[#2E7D52]" />} value={velocity.rate || '0%'} badge={velocity.status || 'Not started'} footer={velocity.target || 'Awaiting activity'} side={velocity.pacePercentile || '—'} />
    <Metric title="Retention Signal" value={retention} footer="Derived from current mastery" side={progressData?.topics?.length ? 'Live' : 'No data'} />
    <Metric title="Focused Activity" icon={<Clock className="w-3.5 h-3.5 text-[#C07D1C]" />} value={`${focused.total || 0} hrs`} badge={focused.recentDelta || 'No activity'} footer={focused.scope || 'No active domains'} />
    <Metric title={`Upcoming ${next?.week || 'Gate'}`} icon={<Calendar className="w-3.5 h-3.5 text-[#A8421E]" />} value={next?.status === 'in-progress' ? 'In progress' : next ? 'Upcoming' : 'Complete'} footer={next?.title || 'Complete a diagnostic to create your pathway'} />
  </div>;
}
function Metric({ title, icon, value, badge, footer, side }) { return <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[170px]"><div className="flex items-center justify-between"><span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">{title}</span>{icon || null}</div><div className="my-2.5 flex items-baseline gap-2"><span className="text-2xl font-bold font-mono">{value}</span>{badge && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52]">{badge}</span>}</div><div className="text-[11px] font-mono text-[#78716C] border-t border-[#F0ECE1] pt-2 flex items-center justify-between"><span className="truncate">{footer}</span>{side && <span className="font-semibold shrink-0 ml-2">{side}</span>}</div></div>; }
