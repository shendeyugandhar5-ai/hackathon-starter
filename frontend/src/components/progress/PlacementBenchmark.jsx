import React from 'react';
import { Target } from 'lucide-react';

export default function PlacementBenchmark({ progressData }) {
  const subjects = progressData?.subjects || [];
  const role = progressData?.targetRole || 'Learner';
  const fit = progressData?.placementFit || 0;
  const topics = progressData?.topics || [];
  const strengths = [...topics].sort((a,b)=>b.score-a.score).slice(0,3);
  const gaps = [...topics].sort((a,b)=>a.score-b.score).slice(0,3);
  return <div className="space-y-4">
    <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-sm">Curricular Mastery</h3><p className="text-[11px] text-[#78716C]">Only this learner's domains</p></div><Target className="w-4 h-4 text-[#A8421E]"/></div><div className="mt-4 space-y-3">{subjects.length ? subjects.map((s)=><div key={s.subject}><div className="flex justify-between text-xs font-medium"><span className="capitalize">{s.subject}</span><span className="font-mono">{Math.round(s.average_score*100)}%</span></div><div className="w-full bg-[#EAE5DC] h-1.5 rounded-full mt-1.5"><div className={`h-full rounded-full ${s.average_score<.5?'bg-[#B93826]':'bg-[#2E7D52]'}`} style={{width:`${Math.round(s.average_score*100)}%`}}/></div><div className="text-[10px] font-mono text-[#8C827A] mt-1">Focus: {s.weak_topics?.[0]?.replace(/_/g,' ') || 'Continue strengthening'}</div></div>) : <div className="py-6 text-center text-xs font-mono text-[#8C827A]">No mastery records yet.</div>}</div></div>
    <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"><h3 className="font-semibold text-sm">Placement Benchmark</h3><p className="text-[11px] text-[#78716C]">Goal: {role}</p><div className="mt-4 flex items-end gap-2"><span className="text-3xl font-bold font-mono text-[#A8421E]">{fit}</span><span className="text-xs text-[#78716C] mb-1">/100 fit</span></div><div className="w-full bg-[#EAE5DC] h-2 rounded-full mt-2"><div className="h-full bg-[#A8421E] rounded-full" style={{width:`${fit}%`}}/></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="p-3 rounded-lg bg-[#EAF4EE] border border-[#CDE5D5]"><div className="text-[9px] font-mono text-[#2E7D52]">TOP STRENGTHS</div>{strengths.length ? strengths.map(t=><div key={t.topic} className="text-xs mt-1 capitalize">{t.topic.replace(/_/g,' ')}</div>) : <div className="text-xs mt-1">None yet</div>}</div><div className="p-3 rounded-lg bg-[#FDF0ED] border border-[#F7CFC2]"><div className="text-[9px] font-mono text-[#B93826]">NEXT GAPS</div>{gaps.length ? gaps.map(t=><div key={t.topic} className="text-xs mt-1 capitalize">{t.topic.replace(/_/g,' ')}</div>) : <div className="text-xs mt-1">Diagnostic needed</div>}</div></div></div>
  </div>;
}
