import React from 'react';
import { Target, Check, Sparkles, BookOpen, Layers } from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'Software Engineering', label: 'Software Engineering', icon: '< >' },
  { id: 'Data Science', label: 'Data Science', icon: '📈' },
  { id: 'AI/ML', label: 'AI/ML', icon: '🤖' },
  { id: 'Placement Preparation', label: 'Placement Preparation', icon: '🎯' },
  { id: 'Other Goal', label: 'Other Goal', icon: '✨' },
];

const TUTOR_OPTIONS = [
  {
    id: 'DSA Tutor',
    alias: 'dsa',
    label: 'DSA Tutor',
    code: 'DSA',
    description: 'Data Structures, Graph Traversals & Algorithmic Complexity',
    activeClass: 'bg-[#A8421E] text-white border-[#A8421E] shadow-xs',
    accentColor: '#A8421E'
  },
  {
    id: 'DBMS Tutor',
    alias: 'dbms',
    label: 'DBMS Tutor',
    code: 'DBMS',
    description: 'Relational Algebra, SQL Optimization & Index Tuning',
    activeClass: 'bg-[#2E7D52] text-white border-[#2E7D52] shadow-xs',
    accentColor: '#2E7D52'
  },
  {
    id: 'Maths Tutor',
    alias: 'maths',
    label: 'Maths Tutor',
    code: 'MATH',
    description: 'Discrete Math, Linear Algebra & Probability Proofs',
    activeClass: 'bg-[#C07D1C] text-white border-[#C07D1C] shadow-xs',
    accentColor: '#C07D1C'
  },
  {
    id: 'AIML Tutor',
    alias: 'aiml',
    label: 'AIML Tutor',
    code: 'AIML',
    description: 'Machine Learning, Neural Models & Statistical Inference',
    activeClass: 'bg-[#DF7356] text-white border-[#DF7356] shadow-xs',
    accentColor: '#DF7356'
  },
  {
    id: 'General Strategy',
    alias: 'general',
    label: 'General Strategy',
    code: 'GEN',
    description: 'Prerequisite Roadmapping & Multi-Agent Curriculum Synthesis',
    activeClass: 'bg-[#57534E] text-white border-[#57534E] shadow-xs',
    accentColor: '#57534E'
  },
];

export default function LearningPreferences({
  goal,
  setGoal,
  focusTutors,
  setFocusTutors
}) {
  // Helper to check if a tutor option is selected
  const isTutorSelected = (tutor) => {
    if (!Array.isArray(focusTutors)) return false;
    return focusTutors.some(
      (item) =>
        item === tutor.id ||
        item === tutor.label ||
        item?.toLowerCase() === tutor.alias ||
        item?.toLowerCase() === tutor.code.toLowerCase() ||
        item?.toLowerCase() === tutor.id.toLowerCase()
    );
  };

  // Toggle tutor selection
  const toggleTutor = (tutor) => {
    const isSelected = isTutorSelected(tutor);
    let updated;
    if (isSelected) {
      updated = focusTutors.filter(
        (item) =>
          item !== tutor.id &&
          item !== tutor.label &&
          item?.toLowerCase() !== tutor.alias &&
          item?.toLowerCase() !== tutor.code.toLowerCase() &&
          item?.toLowerCase() !== tutor.id.toLowerCase()
      );
    } else {
      // Store using canonical label
      updated = [...(focusTutors || []), tutor.label];
    }
    setFocusTutors(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-[#EAE5DC] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
        <div>
          <h2 className="font-serif text-lg font-normal text-[#1C1917]">
            Learning Preferences
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Configure your curriculum goals and activate specialist AI tutors for autonomous orchestration.
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8421E] px-2 py-0.5 rounded bg-[#FDF2EE] border border-[#FADCD1] font-semibold">
          ORCHESTRATOR TELEMETRY
        </span>
      </div>

      {/* Goal Selection */}
      <div className="space-y-2.5">
        <label className="block text-[11px] font-mono uppercase tracking-wider text-[#57534E] font-semibold">
          WHAT ARE YOU PREPARING FOR?
        </label>
        <p className="text-xs text-[#78716C]">
          Choose the primary benchmark for prerequisite tracing and placement velocity calculations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {GOAL_OPTIONS.map((opt) => {
            const isSelected = goal === opt.id || goal === opt.label;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGoal(opt.id)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FDF4F0] border-[#A8421E] text-[#1C1917] shadow-2xs ring-1 ring-[#A8421E]'
                    : 'bg-[#FAF7F2] border-[#EAE5DC] text-[#57534E] hover:border-[#D1CCC5] hover:bg-[#F6EFE6]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">{opt.icon}</span>
                  <span className={`text-xs ${isSelected ? 'font-semibold text-[#A8421E]' : 'font-medium'}`}>
                    {opt.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Focus Tutors Multi-Select */}
      <div className="space-y-2.5 pt-3 border-t border-[#F0ECE1]">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#57534E] font-semibold">
            FOCUS TUTORS (SPECIALIST AGENTS)
          </label>
          <span className="text-[10px] font-mono text-[#78716C]">
            {focusTutors?.length || 0} active
          </span>
        </div>
        <p className="text-xs text-[#78716C]">
          Active tutors participate in collaborative consensus loops and generate targeted diagnostic drills.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {TUTOR_OPTIONS.map((tutor) => {
            const isSelected = isTutorSelected(tutor);
            return (
              <button
                key={tutor.id}
                type="button"
                onClick={() => toggleTutor(tutor)}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${tutor.activeClass} ring-1 ring-black/10`
                    : 'bg-[#FAF7F2] border-[#EAE5DC] text-[#57534E] hover:border-[#D1CCC5] hover:bg-[#F6EFE6]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#A8421E]'
                      }`}
                    />
                    <span className="text-xs font-semibold">
                      {tutor.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EAE5DC] text-[#57534E]'
                    }`}
                  >
                    {tutor.code}
                  </span>
                </div>
                <p
                  className={`text-[11px] leading-tight ${
                    isSelected ? 'text-white/90' : 'text-[#78716C]'
                  }`}
                >
                  {tutor.description}
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                  <span className={isSelected ? 'text-white/80' : 'text-[#8C827A]'}>
                    {isSelected ? 'Active in mesh' : 'Click to activate'}
                  </span>
                  <span className="font-bold">
                    {isSelected ? '✓ Selected' : '+ Add'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
