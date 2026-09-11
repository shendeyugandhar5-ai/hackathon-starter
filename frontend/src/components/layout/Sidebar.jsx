import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  BrainCircuit, 
  Network, 
  TrendingUp, 
  GitFork, 
  History, 
  Settings, 
  HelpCircle, 
  ShieldAlert, 
  ChevronRight,
  Radio,
  ExternalLink,
  LogOut,
  UserCheck
} from 'lucide-react';
import EduLogo from '../ui/EduLogo';
import { useAuth } from '../../context/AuthContext';
import { studentProfile, specialistAgents } from '../../data/mockData';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { label: 'Tutor Orchestration', shortLabel: 'Tutor', path: '/app/tutor', icon: Bot },
    { label: 'Student Brain', shortLabel: 'Student Brain', path: '/app/student-brain', icon: BrainCircuit },
    { label: 'Knowledge Map', shortLabel: 'Knowledge Map', path: '/app/knowledge-map', icon: Network },
    { label: 'Progress & Roadmap', shortLabel: 'Progress & Roadmap', path: '/app/progress', icon: TrendingUp },
    { label: 'Session History', shortLabel: 'History', path: '/app/history', icon: History },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || studentProfile.name;
  const displayInitials = profile?.initials || studentProfile.initials;
  const displayTrack = profile?.track || studentProfile.track;
  const displayMastery = profile?.mastery ?? studentProfile.overallMastery;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#161514] text-[#D1CCC5] flex flex-col border-r border-[#2C2926] transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header */}
        <div className="p-4 pb-3 border-b border-[#2C2926]">
          <div className="flex items-center justify-between">
            <EduLogo variant="dark" />
            <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#1F2C23] text-[#4ADE80] border border-[#2E5E3B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></span>
              5 Ready
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-2.5 px-1 text-[11px] font-mono text-[#8E8880]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></span>
            <span>Orchestrator Mesh Active</span>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto dark-scroll px-3 py-4 space-y-6">
          {/* Main Navigation Section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-[#78716C] uppercase font-semibold">
              COGNITIVE WORKSPACE
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/app/student-brain' && location.pathname === '/app');
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group
                      ${isActive 
                        ? 'bg-[#A8421E] text-white shadow-sm font-semibold' 
                        : 'text-[#B0A99F] hover:text-white hover:bg-[#242220]'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white' : 'text-[#8E8880] group-hover:text-white group-hover:scale-105'}`} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Specialist Agents Section */}
          <div className="pt-2 border-t border-[#262421]">
            <div className="p-2.5 rounded-xl bg-[#1C1B19] border border-[#2A2724]">
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-medium text-[#D1CCC5]">
                  Specialist Agents
                </span>
                <span className="text-[10px] font-mono text-[#4ADE80] font-medium">
                  4 Online
                </span>
              </div>

              {/* Agent badges grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {['MATH', 'AIML', 'DSA', 'DBMS'].map((agentCode) => (
                  <div 
                    key={agentCode}
                    className="flex items-center justify-center py-1.5 px-1 rounded-md bg-[#242220] hover:bg-[#2F2C28] border border-[#33302C] text-[10px] font-mono font-medium text-[#C5BFB5] hover:text-white transition-colors cursor-pointer"
                  >
                    {agentCode}
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Escalation Button */}
            <div className="mt-3">
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1C1B19] hover:bg-[#242220] border border-[#2A2724] text-left transition-colors text-xs text-[#C5BFB5] group cursor-pointer">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span className="font-medium text-xs text-[#E0DCD5]">Teacher Escalation</span>
                </div>
                <span className="text-[10px] font-mono text-[#4ADE80] font-medium">
                  Ready
                </span>
              </button>
            </div>
          </div>

          {/* Settings & Help */}
          {/* Settings & Help */}
          <div className="px-1 space-y-1">
            <NavLink
              to="/app/profile"
              onClick={() => onClose && onClose()}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#8E8880] hover:text-[#D1CCC5] hover:bg-[#201E1C] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span className="text-[11px]">Profile & Preferences</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#635F5A]" />
            </NavLink>
          </div>
        </div>

        {/* User Profile Footer with dynamic user data & logout menu */}
        <div className="p-3 border-t border-[#2C2926] bg-[#141312] relative">
          
          {/* Popover / Actions Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-16 left-3 right-3 bg-[#201E1C] rounded-xl border border-[#2E2B27] p-2 shadow-xl z-20 space-y-1 text-xs animate-fade-in">
              <div className="px-2.5 py-1.5 border-b border-[#2C2926]">
                <div className="font-semibold text-[#EDE9E3] truncate">
                  {displayName}
                </div>
                <div className="text-[10px] font-mono text-[#8E8880] truncate mt-0.5">
                  {profile?.academic_email || profile?.email || user?.email || 'student@university.edu'}
                </div>
              </div>
              
              <NavLink
                to="/app/profile"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#C5BFB5] hover:text-white hover:bg-[#2B2825] transition-colors cursor-pointer text-left"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#A8421E]" />
                <span className="font-medium">Student Profile</span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#E07A5F] hover:bg-[#2B2825] transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}

          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#201E1C] transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs shrink-0">
                {displayInitials}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-semibold text-[#EDE9E3] leading-tight truncate">
                  {displayName}
                </span>
                <span className="text-[10px] font-mono text-[#8E8880] truncate">
                  {displayTrack} • {displayMastery}%
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#2D2A26] text-[10px] font-mono text-[#A8421E] font-bold shrink-0 ml-1">
              W1
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
