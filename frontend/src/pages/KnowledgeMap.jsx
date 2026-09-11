import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Network, AlertTriangle, Play, Move } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { useStudentId } from '../hooks/useStudentId';
import { knowledgeService } from '../services/knowledgeService';

export default function KnowledgeMap() {
  const { setSidebarOpen } = useOutletContext();
  const { profile } = useAuth();
  const studentId = useStudentId();
  const [graph, setGraph] = useState({ nodes: [], edges: [], bottlenecks: [] });
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState('all');

  const load = async () => {
    const result = await knowledgeService.getConceptGraph(studentId);
    setGraph(result);
    setSelected((current) => result.nodes.find(n => n.id === current?.id) || result.nodes[0] || null);
  };

  useEffect(() => { load(); }, [studentId]);

  const nodes = graph.nodes.filter(n => subject === 'all' || n.subject === subject);
  const subjects = [...new Set(graph.nodes.map(n => n.subject))];

  return <div className="min-h-screen bg-[#FAF7F2] pb-16"><TopBar onMenuClick={() => setSidebarOpen(true)} />
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
      <div><div className="text-[11px] font-mono text-[#8C827A] mb-2">WORKSPACE CONTEXT / STUDENT MODEL #{String(studentId).slice(0,7)}</div><h1 className="font-serif text-3xl md:text-4xl">Knowledge Graph & Prerequisite Ontology</h1><p className="mt-1 text-sm text-[#57534E]">This graph is generated from {profile?.name || 'this learner'}'s recorded mastery and prerequisite relationships.</p><div className="flex flex-wrap gap-2 mt-4"><button onClick={()=>setSubject('all')} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${subject==='all'?'bg-[#A8421E] text-white border-[#A8421E]':'bg-white border-[#EAE5DC]'}`}>All Subjects</button>{subjects.map(s=><button key={s} onClick={()=>setSubject(s)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${subject===s?'bg-[#A8421E] text-white border-[#A8421E]':'bg-white border-[#EAE5DC]'}`}>{s.toUpperCase()}</button>)}</div></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"><div className="lg:col-span-8 bg-white rounded-xl border border-[#EAE5DC] p-5"><div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]"><div className="flex items-center gap-2 text-xs font-mono"><Network className="w-3.5 h-3.5 text-[#A8421E]"/><b>INTERACTIVE DIRECTED ACYCLIC GRAPH (DAG)</b></div><span className="text-[10px] font-mono text-[#8C827A]"><Move className="inline w-3 h-3"/> {nodes.length} nodes • {graph.edges.length} edges</span></div>
        {!nodes.length ? <div className="min-h-[390px] flex items-center justify-center text-center"><div><Network className="w-10 h-10 mx-auto text-[#DDD5C5]"/><h2 className="font-serif text-xl mt-3">Your graph is waiting for evidence</h2><p className="text-xs text-[#78716C] mt-1 max-w-md">This new learner has no mastery records yet. Start a diagnostic or tutor session; nodes and prerequisite links will be added from the learner's actual activity.</p></div></div> : <div className="min-h-[390px] mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 content-center">{nodes.map((n)=><button key={n.id} onClick={()=>setSelected(n)} className={`text-left p-4 rounded-xl border transition-all ${selected?.id===n.id?'ring-2 ring-[#A8421E]':''} ${n.state==='weak'?'bg-[#FDF0ED] border-[#F7CFC2]':n.state==='mastered'?'bg-[#EAF4EE] border-[#CDE5D5]':'bg-[#FCF4E6] border-[#F3E2C4]'}`}><div className="flex justify-between gap-2"><span className="font-semibold text-sm capitalize">{n.name}</span><span className="font-mono text-xs">{n.score}%</span></div><div className="text-[10px] font-mono mt-2 uppercase">{n.subject} • {n.state}</div><div className="w-full h-1.5 bg-white/70 rounded-full mt-2"><div className={`h-full rounded-full ${n.state==='weak'?'bg-[#B93826]':n.state==='mastered'?'bg-[#2E7D52]':'bg-[#C07D1C]'}`} style={{width:`${n.score}%`}}/></div></button>)}</div>}
      </div>
      <div className="lg:col-span-4 space-y-4"><div className="bg-white rounded-xl border border-[#EAE5DC] p-5"><div className="text-xs font-mono font-bold">NODE DIAGNOSTIC INSPECTOR</div><div className="border-b border-[#F0ECE1] mt-3"/>{selected ? <><div className="text-[10px] font-mono text-[#A8421E] mt-5 uppercase">{selected.subject}</div><h2 className="font-serif text-2xl mt-1">{selected.name}</h2><p className="text-xs text-[#57534E] mt-1">{selected.description}</p><div className="mt-4 p-3 rounded-lg bg-[#FAF7F2] border border-[#EAE5DC] text-xs"><b>{selected.score}%</b> current mastery • <span className="uppercase">{selected.state}</span></div>{selected.prerequisites?.length ? <div className="mt-4 text-[10px] font-mono">PREREQUISITES<div className="flex flex-wrap gap-1 mt-2">{selected.prerequisites.map(p=><span key={p} className="px-2 py-1 rounded bg-[#F8F5EE] border border-[#E7E2D7]">{p.replace(/_/g,' ')}</span>)}</div></div>:null}<button className="mt-5 w-full px-3 py-2 rounded-lg bg-[#A8421E] text-white text-xs font-semibold"><Play className="inline w-3.5 h-3.5 mr-1"/>Practice this node</button></> : <div className="py-12 text-center text-xs font-mono text-[#8C827A]">Select a learner node to inspect it.</div>}</div>
      <div className="bg-white rounded-xl border border-[#EAE5DC] p-5"><div className="flex items-center gap-2 text-xs font-mono"><AlertTriangle className="w-3.5 h-3.5 text-[#B93826]"/> BOTTLENECKS</div><div className="mt-3 text-sm">{graph.bottlenecks.length ? graph.bottlenecks.map(n=><div key={n.id} className="py-2 border-b border-[#F0ECE1] last:border-0"><b>{n.name}</b><div className="text-[10px] font-mono text-[#B93826]">{n.score}% • {n.subject}</div></div>) : <div className="text-xs text-[#78716C] mt-3">No critical prerequisite bottleneck detected.</div>}</div></div></div></div>
    </div></div>;
}
