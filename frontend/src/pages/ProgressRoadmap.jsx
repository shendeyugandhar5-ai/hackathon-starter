import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Download, Sliders, Play, AlertTriangle } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import ProgressMetrics from '../components/progress/ProgressMetrics';
import RoadmapPathway from '../components/progress/RoadmapPathway';
import PlacementBenchmark from '../components/progress/PlacementBenchmark';
import TelemetryStream from '../components/brain/TelemetryStream';
import { useAuth } from '../context/AuthContext';
import { useStudentId } from '../hooks/useStudentId';
import { useTrace } from '../hooks/useStudent';
import { progressService } from '../services/progressService';

export default function ProgressRoadmap() {
  const { setSidebarOpen } = useOutletContext();
  const { profile } = useAuth();
  const studentId = useStudentId();
  const studentGoal = profile?.goal || 'Placement Preparation';
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { entries } = useTrace(studentId, 10);

  useEffect(() => {
    let active = true;
    setLoading(true);
    progressService.getStudentProgress(studentId, studentGoal).then((data) => {
      if (active) { setProgressData(data); setLoading(false); }
    }).catch(() => { if (active) { setProgressData(null); setLoading(false); } });
    return () => { active = false; };
  }, [studentId, studentGoal]);

  const weakestTopic = progressData?.topics?.reduce((weakest, topic) => !weakest || topic.score < weakest.score ? topic : weakest, null);

  const exportReport = () => {
    const payload = { student_id: studentId, generated_at: new Date().toISOString(), goal: studentGoal, progress: progressData };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `eduhive-progress-${String(studentId).slice(0,8)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  if (loading || !progressData) return <div className="min-h-screen bg-[#FAF7F2]"><TopBar onMenuClick={() => setSidebarOpen(true)} /><div className="max-w-7xl mx-auto p-8 text-sm font-mono text-[#8C827A]">Loading your learner model…</div></div>;

  return <div className="min-h-screen bg-[#FAF7F2] pb-12"><TopBar onMenuClick={() => setSidebarOpen(true)} breadcrumbCustom={<div className="flex items-center gap-2 text-xs"><span className="font-medium">{profile?.name || 'Learner'}</span><span>/</span><span className="font-mono">Sprint Week {progressData.sprintPace.currentWeek}</span></div>} rightActions={<div className="flex items-center gap-2"><button onClick={exportReport} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#DDD5C5] text-xs font-mono"><Download className="w-3.5 h-3.5"/>Export Report</button><Link to="/app/profile" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#DDD5C5] text-xs font-mono"><Sliders className="w-3.5 h-3.5"/>Preferences</Link></div>} />
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6"><div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"><div><div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FCE8E1] text-[#A8421E] font-mono text-[10px] border border-[#F7CFC2] mb-2">LIVE LEARNER ANALYTICS</div><h1 className="font-serif text-3xl md:text-4xl">Learning Progress & Milestones</h1><p className="mt-1 text-sm text-[#57534E] max-w-2xl">Personalized for {profile?.name || 'this learner'} • Goal: {studentGoal}.</p></div><div className="bg-white p-3 rounded-xl border border-[#EAE5DC] font-mono text-xs"><span className="text-[#8C827A]">OVERALL </span><b>{progressData.overallMastery}%</b><span className="mx-3 text-[#DDD5C5]">|</span><span className="text-[#8C827A]">FIT </span><b>{progressData.placementFit}/100</b></div></div>
      <ProgressMetrics progressData={progressData}/>
      <div className="bg-[#FDF4F0] border border-[#F5C7B8] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div className="flex gap-3"><AlertTriangle className="w-4 h-4 text-[#B93826] mt-1"/><div><div className="text-[10px] font-mono font-bold text-[#B93826]">{weakestTopic ? 'CURRENT FOCUS' : 'DIAGNOSTIC PENDING'}</div><div className="text-sm font-semibold">{weakestTopic ? `${pretty(weakestTopic.topic)} needs the most practice (${Math.round(weakestTopic.score*100)}%)` : 'Complete your first diagnostic to personalize the roadmap.'}</div></div></div><Link to="/app/tutor" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#A8421E] text-white text-xs font-semibold"><Play className="w-3.5 h-3.5 fill-current"/>Start Socratic Drill</Link></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><div className="lg:col-span-8"><RoadmapPathway progressData={progressData}/></div><div className="lg:col-span-4"><PlacementBenchmark progressData={progressData}/></div></div>
      <TelemetryStream events={entries}/>
    </div></div>;
}
function pretty(v){return String(v||'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());}
