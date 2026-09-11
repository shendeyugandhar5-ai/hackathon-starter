import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { useTranslation } from '../i18n';
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  BrainCircuit, 
  Network, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Code2, 
  Database, 
  Sigma, 
  Bot,
  Play,
  Compass,
  Zap,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import EduLogo from '../components/ui/EduLogo';
import { useAuth } from '../context/AuthContext';
import { specialistAgents } from '../data/mockData';

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const steps = [
    { num: '01', title: 'Ingest', desc: 'Parses complex multi-disciplinary questions & intent.' },
    { num: '02', title: 'Assemble', desc: 'Dynamically routes to the optimal specialist AI panel.' },
    { num: '03', title: 'Probe', desc: 'Calculates background prerequisite confidence weights.' },
    { num: '04', title: 'Scaffold', desc: 'Calibrates explanation level to current cognitive load.' },
    { num: '05', title: 'Socratic', desc: 'Engages in guided dialogue rather than direct answers.' },
    { num: '06', title: 'Test', desc: 'Verifies mental models through micro-derivations.' },
    { num: '07', title: 'Update', desc: 'Recalibrates Bayesian Knowledge Tracing model in real time.' },
    { num: '08', title: 'Recommend', desc: 'Adjusts weekly curriculum sprint to resolve blocker nodes.' }
  ];

  const primaryCtaTarget = isAuthenticated ? '/app/tutor' : '/register';
  const secondaryCtaTarget = isAuthenticated ? '/app/student-brain' : '/login';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] selection:bg-[#FCE8E1] selection:text-[#A8421E] scroll-smooth">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E7E2D7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <EduLogo variant="light" showSub={true} size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#57534E]">
            <a href="#product" className="hover:text-[#A8421E] transition-colors">Product</a>
            <a href="#faculty" className="hover:text-[#A8421E] transition-colors">Faculty Agents</a>
            <a href="#student-brain" className="hover:text-[#A8421E] transition-colors">Student Brain</a>
            <a href="#roadmap" className="hover:text-[#A8421E] transition-colors">Roadmap</a>
            <a href="#outcomes" className="hover:text-[#A8421E] transition-colors">Outcomes</a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            {isAuthenticated ? (
              <Link 
                to="/app/tutor"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('landing.goToWorkspace')}</span>
              </Link>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-xs font-semibold text-[#57534E] hover:text-[#1C1917] px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t('landing.signIn')}
                </Link>
                <Link 
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>{t('landing.getStarted')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Brand Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCE8E1] text-[#A8421E] font-mono text-xs font-semibold tracking-wider uppercase border border-[#F7CFC2] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8421E] animate-pulse"></span>
          {t('landing.tagline')}
        </div>

        {/* Big Editorial Heading */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#1C1917] tracking-tight leading-[1.08] max-w-4xl mx-auto">
          {t('landing.headline1')}<br />
          {t('landing.headline2')} <span className="italic text-[#A8421E] font-medium">hive of experts.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto leading-relaxed">
          EduHive coordinates specialized AI tutors that continuously track your cognitive model, diagnose prerequisite gaps across subjects, and adapt to how your mind works.
        </p>

        {/* CTA Button Row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to={primaryCtaTarget}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-sm font-semibold shadow-sm transition-all"
          >
            <span>{isAuthenticated ? 'Open Learning Workspace' : 'Start Learning Today'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={secondaryCtaTarget}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E7E2D7] text-sm font-medium transition-all shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#A8421E]" />
            <span>{isAuthenticated ? 'View Student Brain' : 'Explore Live Demo'}</span>
          </Link>
        </div>

        {/* Subtle Trust Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#8C827A]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]"></span>
            6 Specialist Tutors
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8421E]"></span>
            Real-time BKT Mastery
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C07D1C]"></span>
            {t('landing.zeroSilos')}
          </span>
        </div>

        {/* Hero Interactive Preview Mockup (Product Section) */}
        <div id="product" className="mt-14 max-w-5xl mx-auto bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden text-left scroll-mt-24">
          {/* Top simulated bar */}
          <div className="bg-[#FAF8F5] px-4 py-3 border-b border-[#EAE5DC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E57373]/60"></span>
              <span className="w-3 h-3 rounded-full bg-[#FFB74D]/60"></span>
              <span className="w-3 h-3 rounded-full bg-[#81C784]/60"></span>
              <span className="text-[11px] font-mono text-[#8C827A] ml-2">EduHive Multi-Agent Orchestrator v2.4</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF4EE] text-[#2E7D52] border border-[#CDE5D5]">
              Active Synthesis
            </span>
          </div>

          {/* Question Box */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E7E2D7]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold">
                Learner Inquiry
              </div>
              <div className="text-base font-semibold text-[#1C1917] mt-1">
                "How does spatial index pruning accelerate vector search in high-dimensional ANN queries?"
              </div>
            </div>

            {/* Agent Collaboration Response Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Maths Agent */}
              <div className="p-4 rounded-xl bg-[#FDF0ED] border border-[#F7CFC2]">
                <div className="flex items-center justify-between pb-2 border-b border-[#F7CFC2]">
                  <span className="text-xs font-semibold text-[#B93826]">Maths Agent</span>
                  <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded text-[#B93826] font-bold">Metric Spaces</span>
                </div>
                <p className="text-xs text-[#57534E] mt-2 leading-relaxed">
                  Calculates triangular inequality bounds to establish lower/upper distance bounds before computing exact cosine similarities.
                </p>
              </div>

              {/* DBMS Agent */}
              <div className="p-4 rounded-xl bg-[#EEF6F8] border border-[#D5EAEF]">
                <div className="flex items-center justify-between pb-2 border-b border-[#D5EAEF]">
                  <span className="text-xs font-semibold text-[#3B7A8C]">DBMS Agent</span>
                  <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded text-[#3B7A8C] font-bold">Storage & Page I/O</span>
                </div>
                <p className="text-xs text-[#57534E] mt-2 leading-relaxed">
                  Prunes candidate partitions via Voronoi cells (IVF-PQ) to minimize random disk reads and cache miss penalties.
                </p>
              </div>

              {/* AIML Agent */}
              <div className="p-4 rounded-xl bg-[#FDF4E6] border border-[#F3E2C4]">
                <div className="flex items-center justify-between pb-2 border-b border-[#F3E2C4]">
                  <span className="text-xs font-semibold text-[#C07D1C]">AIML Agent</span>
                  <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded text-[#C07D1C] font-bold">HNSW Graph Pruning</span>
                </div>
                <p className="text-xs text-[#57534E] mt-2 leading-relaxed">
                  Traverses hierarchical small-world layers greedily, cutting search complexity from O(N) to O(log N).
                </p>
              </div>
            </div>

            {/* Coordinator Synthesis Banner */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E7E2D7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#A8421E] text-white flex items-center justify-center text-xs font-mono font-bold">
                  Σ
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1C1917]">Coordinator Synthesis</div>
                  <div className="text-[11px] text-[#57534E]">Prerequisite checked: Vector Spaces (Mastered) • Indexing (Mastered)</div>
                </div>
              </div>
              <Link
                to={primaryCtaTarget}
                className="text-xs font-mono text-[#A8421E] font-semibold hover:underline hidden sm:inline"
              >
                Inspect Cognitive Graph →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8-Step Collaborative Loop Section (Roadmap / Collaborative Loop) */}
      <section id="roadmap" className="py-20 bg-[#F5EFEB] border-y border-[#E7E2D7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A8421E] font-bold">
              MULTI-AGENT PEDAGOGY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] mt-2">
              {t('landing.loop')}
            </h2>
            <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
              Every interaction cycles through an automated consensus loop to guarantee academic depth without overwhelming working memory.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step) => (
              <div 
                key={step.num}
                className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-[#A8421E]">{step.num}</span>
                  <h3 className="text-sm font-semibold text-[#1C1917] mt-1">{step.title}</h3>
                  <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Faculty Agents Section */}
      <section id="faculty" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A8421E] font-bold">
            SPECIALIZED AI PANEL
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] mt-2">
            {t('landing.meetFaculty')}
          </h2>
          <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
            No single model can master every nuance of modern computing. EduHive assigns dedicated specialists that challenge and support you.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialistAgents.map((agent) => (
            <div 
              key={agent.id}
              className="bg-white rounded-xl p-6 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-[#D4CCBE] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                      style={{ backgroundColor: agent.bg, color: agent.color }}
                    >
                      {agent.id.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#1C1917]">{agent.name} Tutor</h3>
                      <span className="text-[10px] font-mono text-[#8C827A]">{agent.handle}</span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_6px_rgba(74,222,128,0.5)]"></span>
                </div>

                <p className="text-xs text-[#57534E] mt-3.5 leading-relaxed">
                  {agent.role}. Specializes in granular prerequisite tracking, edge-case derivations, and active Socratic questioning.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-[11px] font-mono text-[#A8421E]">
                <span>Active in Telemetry Mesh</span>
                <Link to={isAuthenticated ? `/app/tutor?agent=${agent.id}` : '/register'} className="hover:underline">
                  Ready ➔
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Student Brain / Cognitive Section */}
      <section id="student-brain" className="py-20 bg-white border-t border-[#E7E2D7] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#A8421E] font-bold">
              BAYESIAN KNOWLEDGE TRACING
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1C1917] mt-2">
              {t('landing.adaptive')}
            </h2>
            <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
              Real-time cognitive modeling predicts retention half-life and detects prerequisite gaps before you hit roadblocks.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2 text-center">
              <div className="text-3xl font-bold font-mono text-[#1C1917]">68%</div>
              <div className="text-xs font-semibold text-[#1C1917]">Probabilistic BKT Mastery</div>
              <p className="text-xs text-[#57534E]">Tracks calibrated belief confidence across 26 discrete engineering competency nodes.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2 text-center">
              <div className="text-3xl font-bold font-mono text-[#2E7D52]">0.64</div>
              <div className="text-xs font-semibold text-[#1C1917]">Cognitive Load Index (Optimal)</div>
              <p className="text-xs text-[#57534E]">Allocates working memory efficiently, dynamically balancing scaffolding and derivations.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-2 text-center">
              <div className="text-3xl font-bold font-mono text-[#A8421E]">8.4 Days</div>
              <div className="text-xs font-semibold text-[#1C1917]">Ebbinghaus Retention Half-Life</div>
              <p className="text-xs text-[#57534E]">Automates micro-retrievals at optimal forgetting intervals to guarantee durable recall.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes & Final CTA Section */}
      <section id="outcomes" className="py-20 bg-[#F5EFEB] border-t border-[#E7E2D7] text-center scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EduLogo variant="light" size="lg" />
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#1C1917] mt-4 tracking-tight">
            {t('landing.subheadline')}
          </h2>
          <p className="text-sm sm:text-base text-[#57534E] mt-3 max-w-xl mx-auto leading-relaxed">
            Join thousands of engineering students mastering complex computer science with personalized multi-agent guidance.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={primaryCtaTarget}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-sm font-semibold shadow-sm transition-all"
            >
              <span>{isAuthenticated ? 'Open Learning Workspace' : 'Create Your Learning Hive'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#1C1917] border border-[#E7E2D7] text-sm font-medium transition-all"
              >
                <span>Sign In to Existing Salon</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Editorial Academic Footer */}
      <footer className="bg-[#171615] text-[#A8A29E] py-12 border-t border-[#2C2926] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <EduLogo variant="dark" />
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-[#8E8880]">
            <Link to={isAuthenticated ? "/app/student-brain" : "/login"} className="hover:text-white transition-colors">Cognitive Mesh</Link>
            <Link to={isAuthenticated ? "/app/progress" : "/login"} className="hover:text-white transition-colors">Curriculum Roadmap</Link>
            <Link to="/login" className="hover:text-white transition-colors">Salon Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">{t('landing.register')}</Link>
          </div>

          <div className="text-[10px] font-mono text-[#78716C]">
            © 2026 EduHive Systems Inc. Academic License.
          </div>
        </div>
      </footer>
    </div>
  );
}
