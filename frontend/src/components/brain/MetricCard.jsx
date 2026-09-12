import React from 'react';
import { Compass, Clock, BrainCircuit, TrendingUp } from 'lucide-react';

export default function MetricCard({ type, data }) {
  const mastery = Number(data?.overallMastery || 0);
  const topicCount = Number(data?.totalNodes || 0);
  const attempts = Number(data?.attempts || 0);
  const weakCount = Number(data?.weakCount || 0);

  if (type === 'mastery') {
    return <Card label="GLOBAL STATE">
      <div className="flex items-center gap-4 my-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#EAE5DC" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#A8421E" strokeWidth="8" strokeDasharray="264" strokeDashoffset={264 - (264 * mastery) / 100} strokeLinecap="round" fill="none" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono">{mastery}%</div>
        </div>
        <div>
          <div className="text-sm font-semibold">Overall Mastery</div>
          <div className="text-[11px] font-mono text-[#8C827A]">{topicCount ? `${attempts} recorded attempts` : 'No diagnostic data yet'}</div>
        </div>
      </div>
      <Footer left={`${topicCount} topic nodes tracked`} right={weakCount ? `${weakCount} weak` : 'No weak topics'} />
    </Card>;
  }

  if (type === 'cognitive') {
    const load = topicCount ? Math.min(1, weakCount / topicCount) : 0;
    const label = !topicCount ? 'Awaiting baseline' : load > 0.5 ? 'High support needed' : load > 0.25 ? 'Focused practice' : 'Stable';
    return <Card label="LEARNING LOAD" badge={topicCount ? `${Math.round(load * 100)}% gap load` : 'NO DATA'}>
      <div className="my-3">
        <div className="text-lg font-semibold">{label}</div>
        <div className="flex gap-1.5 mt-2.5">
          {[0,1,2,3,4].map((i) => <div key={i} className={`h-2 flex-1 rounded-full ${i < Math.round(load * 5) ? 'bg-[#B93826]' : 'bg-[#EAE5DC]'}`} />)}
        </div>
      </div>
      <div className="text-[11px] text-[#78716C] border-t border-[#F0ECE1] pt-2">Calculated from this learner's current weak-topic ratio.</div>
    </Card>;
  }

  if (type === 'retention') {
    // No spaced-repetition / recall-interval tracking exists in the schema,
    // so there is no real retention half-life to show — attempts logged is
    // the honest, actually-measured substitute for this card.
    return <Card label="PRACTICE VOLUME" badge={topicCount ? 'Live' : 'NO DATA'}>
      <div className="flex items-center justify-between my-3">
        <div><div className="text-xl font-bold font-mono">{attempts}</div><div className="text-[11px] text-[#8C827A]">attempts recorded</div></div>
        <TrendingUp className="w-6 h-6 text-[#A8421E]" />
      </div>
      <Footer left="Evidence" right={topicCount ? `${topicCount} topics touched` : 'Awaiting activity'} />
    </Card>;
  }

  return <Card label="ACTIVE TEACHING STRATEGY">
    <div className="my-2.5"><div className="text-sm font-semibold">{weakCount ? 'Target weakest prerequisite first' : 'Diagnostic-first onboarding'}</div>
      <div className="flex flex-wrap gap-1.5 mt-2.5"><span className="pill">Adaptive</span><span className="pill">Socratic</span></div>
    </div>
    <div className="text-[11px] text-[#78716C] border-t border-[#F0ECE1] pt-2 flex items-center gap-1"><Compass className="w-3 h-3 text-[#A8421E]" /> Based on current learner state</div>
  </Card>;
}

function Card({ label, badge, children }) { return <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[190px]"><div className="flex items-center justify-between"><span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">{label}</span>{badge && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4EFE6] text-[#57534E] border border-[#DDD5C5]">{badge}</span>}</div>{children}</div>; }
function Footer({ left, right }) { return <div className="text-[11px] text-[#57534E] border-t border-[#F0ECE1] pt-2 flex items-center justify-between font-mono"><span>{left}</span><span className="text-[#2E7D52] font-semibold">{right}</span></div>; }
function Pill({ children }) { return <span className="pill text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F5EE] text-[#57534E] border border-[#E7E2D7]">{children}</span>; }
