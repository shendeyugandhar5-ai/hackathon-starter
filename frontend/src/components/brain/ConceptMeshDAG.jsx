import React, { useState } from 'react';
import { Network, Maximize2, Sparkles, Filter, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ConceptMeshDAG() {
  const [selectedNode, setSelectedNode] = useState('prob');

  const nodes = [
    { id: 'linalg', title: 'Linear Alg', score: '89%', type: 'foundation', cx: 60, cy: 70, r: 24, fill: '#EAF4EE', stroke: '#2E7D52', textFill: '#1C1917' },
    { id: 'calc', title: 'Calculus', score: '91%', type: 'foundation', cx: 60, cy: 170, r: 24, fill: '#EAF4EE', stroke: '#2E7D52', textFill: '#1C1917' },
    { id: 'prob', title: 'Cond Prob', sub: 'Maths #14', score: '42%', type: 'blocked', cx: 200, cy: 120, r: 28, fill: '#FDF0ED', stroke: '#B93826', textFill: '#B93826', isBlocker: true },
    { id: 'bayes', title: 'Naive Bayes', sub: 'AIML #21', score: '67%', type: 'frontier', cx: 340, cy: 120, r: 28, fill: '#FCF4E6', stroke: '#C07D1C', textFill: '#C07D1C' },
    { id: 'trees', title: 'ML Trees', score: '54%', type: 'target', cx: 450, cy: 70, r: 22, fill: '#F8F5EE', stroke: '#DDD5C5', textFill: '#57534E' },
    { id: 'loss', title: 'Loss Func', score: '84%', type: 'foundation', cx: 450, cy: 170, r: 22, fill: '#EAF4EE', stroke: '#2E7D52', textFill: '#1C1917' },
  ];

  return (
    <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
          <div className="flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-[#A8421E]" />
            <h3 className="font-semibold text-sm text-[#1C1917]">
              Probabilistic Concept Mesh
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#57534E] border border-[#E7E2D7]">
              DAG View
            </span>
            <Link 
              to="/app/knowledge-map" 
              className="p-1 rounded hover:bg-[#FAF7F2] text-[#8C827A] hover:text-[#1C1917] transition-colors"
              title="Expand Full Knowledge Map"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* SVG Mesh Visualization Canvas */}
        <div className="mt-3 relative bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] p-3 overflow-hidden">
          <svg viewBox="0 0 520 240" className="w-full h-auto select-none">
            <defs>
              {/* Marker arrows */}
              <marker id="arrow-solid" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#C5BFB5" />
              </marker>
              <marker id="arrow-blocked" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#B93826" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="32" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#C07D1C" />
              </marker>
            </defs>

            {/* Connecting Edges / Splines */}
            {/* LinAlg -> Prob */}
            <path d="M 84,70 C 130,70 150,110 172,118" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" />
            {/* Calc -> Prob */}
            <path d="M 84,170 C 130,170 150,130 172,122" fill="none" stroke="#D1CCC5" strokeWidth="1.5" strokeDasharray="3,3" />
            
            {/* Prob -> Bayes (BLOCKER CONNECTION: Animated red dashed line) */}
            <path 
              d="M 228,120 L 312,120" 
              fill="none" 
              stroke="#B93826" 
              strokeWidth="2.5" 
              strokeDasharray="4,3" 
              markerEnd="url(#arrow-blocked)"
              className="animate-pulse"
            />
            
            {/* Bayes -> Trees */}
            <path d="M 368,120 C 400,120 410,80 428,75" fill="none" stroke="#D1CCC5" strokeWidth="1.5" markerEnd="url(#arrow-solid)" />
            {/* Bayes -> Loss */}
            <path d="M 368,120 C 400,120 410,160 428,165" fill="none" stroke="#D1CCC5" strokeWidth="1.5" markerEnd="url(#arrow-solid)" />

            {/* Nodes */}
            {nodes.map((n) => {
              const isSelected = selectedNode === n.id;

              return (
                <g 
                  key={n.id} 
                  className="cursor-pointer transition-transform duration-150 hover:scale-105"
                  onClick={() => setSelectedNode(n.id)}
                >
                  {/* Outer glow ring for blocker */}
                  {n.isBlocker && (
                    <circle
                      cx={n.cx}
                      cy={n.cy}
                      r={n.r + 6}
                      fill="none"
                      stroke="#B93826"
                      strokeWidth="1.5"
                      opacity="0.35"
                      className="animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={n.cx}
                    cy={n.cy}
                    r={n.r}
                    fill={n.fill}
                    stroke={n.stroke}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="drop-shadow-xs"
                  />

                  {/* Center Node Label */}
                  <text
                    x={n.cx}
                    y={n.sub ? n.cy - 3 : n.cy + 1}
                    textAnchor="middle"
                    className="text-[10px] font-semibold"
                    fill={n.textFill}
                  >
                    {n.title}
                  </text>
                  
                  {/* Score or Sub label */}
                  <text
                    x={n.cx}
                    y={n.sub ? n.cy + 9 : n.cy + 12}
                    textAnchor="middle"
                    className="text-[8.5px] font-mono font-medium"
                    fill={n.type === 'blocked' ? '#B93826' : n.type === 'frontier' ? '#C07D1C' : '#78716C'}
                  >
                    {n.score}
                  </text>
                </g>
              );
            })}

            {/* Annotation label for blocker */}
            <text x="270" y="108" textAnchor="middle" className="text-[8px] font-mono font-bold tracking-wider" fill="#B93826">
              Prereq Blocker
            </text>
          </svg>

          {/* Canvas Legend */}
          <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[#78716C] pt-2 border-t border-[#EAE5DC] mt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#B93826]"></span>
                Blocked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C07D1C]"></span>
                Active Frontier
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2E7D52]"></span>
                Upstream Foundation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-[#78716C] leading-snug">
          Dependency weights auto-calibrated by Bayesian Markov blanket inference.
        </p>

        <Link
          to="/app/tutor?mode=remediation&node=14"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shrink-0 shadow-xs transition-colors"
        >
          <span>Focus Remediation Path</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
