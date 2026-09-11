import React, { useMemo } from 'react';
import { Network, Maximize2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ConceptMeshDAG({ nodes = [] }) {
  const visible = useMemo(() => nodes.slice(0, 8), [nodes]);
  return <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] h-full">
    <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]"><div className="flex items-center gap-2"><Network className="w-3.5 h-3.5 text-[#A8421E]" /><h3 className="font-semibold text-sm">Probabilistic Concept Mesh</h3></div><Link to="/app/knowledge-map" className="p-1 rounded hover:bg-[#FAF7F2]"><Maximize2 className="w-3.5 h-3.5" /></Link></div>
    {!visible.length ? <div className="mt-3 min-h-[230px] flex items-center justify-center text-center text-xs font-mono text-[#8C827A] border border-dashed border-[#EAE5DC] rounded-xl">Your knowledge graph will appear here<br />after the first diagnostic or assessment.</div> : <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">{visible.map((node) => <div key={node.id} className={`p-3 rounded-lg border ${node.state === 'weak' ? 'bg-[#FDF0ED] border-[#F7CFC2]' : node.state === 'mastered' ? 'bg-[#EAF4EE] border-[#CDE5D5]' : 'bg-[#FCF4E6] border-[#F3E2C4]'}`}><div className="text-xs font-semibold capitalize">{node.name}</div><div className="text-[10px] font-mono mt-1">{node.score == null ? 'NEW' : `${node.score}%`} • {String(node.state || 'new').toUpperCase()}</div></div>)}</div>}
    <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-[11px] text-[#78716C]"><span>{nodes.length} learner nodes</span><Link to="/app/knowledge-map" className="text-[#A8421E] font-medium flex items-center gap-1">Open map <ChevronRight className="w-3 h-3" /></Link></div>
  </div>;
}
