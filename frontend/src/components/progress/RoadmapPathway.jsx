import React, { useState } from 'react';
import { Check, Lock, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RoadmapPathway({ progressData }) {
  const [tab, setTab] = useState('all');
  const milestones = progressData?.milestones || [];
  const currentWeek = progressData?.sprintPace?.currentWeek || 1;
  const visible = tab === 'active' ? milestones.filter((m) => m.week === `W${currentWeek}` || m.status === 'in-progress') : tab === 'gates' ? milestones.filter((m) => m.status !== 'upcoming') : milestones;
  const completed = milestones.filter((m) => m.status === 'completed').length;

  return <div className="bg-white rounded-xl p-5 md:p-6 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0ECE1]"><div><h2 className="font-serif text-xl">8-Week Structured Pathway</h2><p className="text-xs text-[#78716C] mt-0.5">Generated from your current mastery and learning goal.</p></div><div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#EAE5DC] text-xs font-mono">{[['all','All Sprints'],['active',`Active (W${currentWeek})`],['gates','Milestone Gates']].map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`px-2.5 py-1 rounded-md ${tab===id?'bg-white shadow-xs font-semibold':'text-[#78716C]'}`}>{label}</button>)}</div></div>
    {!milestones.length ? <Empty /> : <div className="mt-6 space-y-4">{visible.map((m, index) => { const done=m.status==='completed'; const active=m.status==='in-progress'; return <div key={`${m.week}-${m.title}`} className="relative pl-9"><div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 ${done?'bg-[#EAF4EE] border-[#2E7D52] text-[#2E7D52]':active?'bg-[#FCF4E6] border-[#C07D1C] text-[#C07D1C]':'bg-[#F8F5EE] border-[#DDD5C5] text-[#8C827A]'}`}>{done?<Check className="w-3.5"/>:active?<Play className="w-3 h-3 fill-current"/>:<Lock className="w-3 h-3"/>}</div>{index<visible.length-1 && <div className="absolute left-3.5 top-8 bottom-[-16px] w-px bg-[#EAE5DC]"/>}<div className={`rounded-xl p-4 border ${active?'border-[#E5C083] bg-[#FFFCF5]':'border-[#EAE5DC] bg-[#FAF8F5]'}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-mono font-bold text-[#8C827A]">{m.week} • {String(m.status).toUpperCase()}</span><span className="text-[10px] font-mono">{done?'Completed':active?'Current':'Locked'}</span></div><h3 className="font-semibold text-sm mt-1.5">{m.title}</h3><p className="text-xs text-[#57534E] mt-1">{active ? `Current sprint for ${progressData.targetRole}.` : done ? 'Completed based on your current mastery.' : 'Unlocks as your mastery increases.'}</p></div></div>; })}</div>}
    <div className="mt-5 pt-3 border-t border-[#F0ECE1] text-[11px] font-mono text-[#78716C]">{completed} of {milestones.length} milestones completed • Week {currentWeek} / 8</div>
  </div>;
}
function Empty(){return <div className="py-14 text-center text-xs font-mono text-[#8C827A]">No pathway data yet.<br/>Complete your first diagnostic to generate a personalized roadmap.</div>}
