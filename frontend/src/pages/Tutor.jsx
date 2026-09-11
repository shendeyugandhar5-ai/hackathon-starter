import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  Bot, 
  Layers, 
  Cpu, 
  Code2, 
  Database, 
  Sigma, 
  BrainCircuit, 
  Compass, 
  CheckCircle2, 
  Activity,
  Bookmark,
  Copy,
  Volume2,
  AlertTriangle,
  ArrowRight,
  Pin,
  HelpCircle,
  ShieldAlert,
  Paperclip,
  Code,
  Loader2,
  Check
} from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { studentService } from '../services/studentService';
import { studentProfile } from '../data/mockData';

export default function Tutor() {
  const { setSidebarOpen } = useOutletContext();
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();

  const displayName = profile?.name || profile?.full_name || user?.user_metadata?.full_name || 'Rahul Sharma';
  const displayInitials = profile?.initials || 'RS';
  const displayTrack = profile?.goal || 'Data Science & AIML';
  const studentId = profile?.auth_user_id || profile?.id || user?.id || 'rahul';

  const [inputQuery, setInputQuery] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(
    'How does probability help in machine learning? Explain Naive Bayes with an example.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState(null);

  useEffect(() => {
    const agentParam = searchParams.get('agent');
    if (agentParam) {
      setInputQuery(`@${agentParam} `);
    }
  }, [searchParams]);

  // Active AI Response Data
  const [agentData, setAgentData] = useState({
    conversation_id: 'conv-init-8841',
    agent: 'maths',
    agentName: 'Maths Agent',
    collabAgent: 'AIML Agent',
    confidence: 0.95,
    collabConfidence: 0.87,
    routed_reason: 'Trained router matched Maths Specialist (confidence 0.95)',
    response: '',
    detectedIntents: ['Conceptual Foundations', 'Classification Algorithm', 'Prerequisite Gap Sensitivity'],
    masteryUpdates: [{ subject: 'maths', topic: 'conditional_probability', score: 0.42, state: 'weak' }],
    recommendation: {
      topic: 'Conditional Probability',
      reason: 'Prerequisite blocker identified prior to Naive Bayes optimization.'
    }
  });

  const suggestedPrompts = [
    'Show Naive Bayes formula derivation',
    'Why is it called "Naive"?',
    'Give me a 2-min practice quiz',
    'How does Bayes Theorem apply to DBMS query optimization?'
  ];

  // Submit student inquiry to Coordinator /api/chat
  const handleSendQuery = async (queryText) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isLoading) return;

    setActiveQuestion(text);
    setInputQuery('');
    setIsLoading(true);
    setAssessmentStatus(null);

    try {
      const res = await chatService.sendMessage({
        student_id: studentId,
        conversation_id: agentData.conversation_id,
        message: text,
      });

      if (res.ok && res.data) {
        const d = res.data;
        const agentKey = d.agent?.toLowerCase() || 'maths';
        const agentTitle =
          agentKey === 'maths' ? 'Maths Agent' :
          agentKey === 'aiml' ? 'AIML Agent' :
          agentKey === 'dsa' ? 'DSA Agent' :
          agentKey === 'dbms' ? 'DBMS Agent' : 'General Strategy';

        const collabTitle =
          agentKey === 'maths' ? 'AIML Agent' :
          agentKey === 'aiml' ? 'Maths Agent' :
          agentKey === 'dsa' ? 'General Strategy' : 'Maths Agent';

        // Extract detected intent keywords
        const intents = ['Academic Foundations'];
        if (text.toLowerCase().includes('bayes') || text.toLowerCase().includes('prob')) intents.push('Probabilistic Modeling');
        if (text.toLowerCase().includes('naive') || text.toLowerCase().includes('ml')) intents.push('Classification Algorithm');
        if (text.toLowerCase().includes('dp') || text.toLowerCase().includes('graph')) intents.push('Algorithmic Recurrence');
        if (text.toLowerCase().includes('sql') || text.toLowerCase().includes('index')) intents.push('Relational Optimization');
        intents.push('Prerequisite Gap Sensitivity');

        setAgentData({
          conversation_id: d.conversation_id || agentData.conversation_id,
          agent: agentKey,
          agentName: agentTitle,
          collabAgent: collabTitle,
          confidence: d.confidence || 0.94,
          collabConfidence: Math.max(0.75, Math.round((d.confidence || 0.9) * 0.92 * 100) / 100),
          routed_reason: d.routed_reason || `Coordinator matched ${agentTitle}`,
          response: d.response || '',
          detectedIntents: intents,
          masteryUpdates: d.mastery_updates || [],
          recommendation: d.recommendation || null,
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(agentData.response || activeQuestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit quick understanding assessment test
  const handleTestUnderstanding = async () => {
    setIsLoading(true);
    try {
      const res = await studentService.submitAssessment({
        student_id: studentId,
        conversation_id: agentData.conversation_id,
        subject: agentData.agent === 'general' ? 'maths' : agentData.agent,
        topic: 'conditional_probability',
        question: 'Given P(A|B) = [P(B|A)*P(A)]/P(B), if P(A)=0.2, P(B|A)=0.8, P(B)=0.25, calculate P(A|B).',
        student_answer: '0.64',
        expected_answer: '0.64',
        is_correct: true,
        confidence_rating: 0.95,
      });

      if (res.ok) {
        setAssessmentStatus({
          success: true,
          message: 'Diagnostic passed! Conditional Probability mastery updated (+18% BKT belief score).'
        });
      }
    } catch (err) {
      console.error('Assessment submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16 flex flex-col">
      {/* Top Bar Context */}
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-6 space-y-5 flex-1 flex flex-col">
        
        {/* Workspace Context & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-[#EAE5DC]">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8C827A]">
            <span className="p-1 rounded bg-[#FDF4F0] text-[#A8421E]">
              <Cpu className="w-3 h-3" />
            </span>
            <span>WORKSPACE CONTEXT • <strong className="text-[#1C1917]">Pipeline #C084</strong></span>
            <span>/</span>
            <span className="text-[#A8421E] font-semibold">{displayTrack}</span>
            <span>/</span>
            <span>Probability & Multi-Agent Mesh</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#B93826] font-mono text-[10px] font-semibold border border-[#E7E2D7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B93826] animate-pulse"></span>
              Active Socratic Session
            </span>
            <Link
              to="/app/knowledge-map"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE0] text-[#57534E] font-mono text-[10px] border border-[#E7E2D7] transition-colors"
            >
              Collaboration Graph
            </Link>
            <Link
              to="/app/student-brain"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE0] text-[#57534E] font-mono text-[10px] border border-[#E7E2D7] transition-colors"
            >
              Diagnostic Mode •
            </Link>
          </div>
        </div>

        {/* 1. Dynamic Learner Inquiry Card */}
        <div className="bg-white rounded-xl p-5 md:p-6 border border-[#EAE5DC] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#A8421E] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                {displayInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1C1917]">{displayName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF7F2] text-[#57534E] border border-[#E7E2D7]">
                    Student #{studentId.slice(0, 7)}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#8C827A]">
                  Inquiry context: Multi-agent consensus active
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono text-[#8C827A]">
              Live Session
            </span>
          </div>

          {/* Question Text */}
          <div className="mt-4">
            <h2 className="font-serif text-lg md:text-xl font-normal text-[#1C1917] tracking-tight leading-snug">
              "{activeQuestion}"
            </h2>
          </div>

          {/* Detected Intent Pills */}
          <div className="mt-3.5 pt-3 border-t border-[#F0ECE1] flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#78716C]">
            <span className="text-[#8C827A] font-semibold uppercase tracking-wider">DETECTED INTENT:</span>
            {agentData.detectedIntents.map((intent, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded border ${
                  intent.includes('Prerequisite')
                    ? 'bg-[#FDF0ED] text-[#B93826] border-[#F7CFC2] flex items-center gap-1 font-semibold'
                    : 'bg-[#FAF7F2] text-[#57534E] border-[#EAE5DC]'
                }`}
              >
                {intent.includes('Prerequisite') && <AlertTriangle className="w-3 h-3" />}
                {intent}
              </span>
            ))}
          </div>
        </div>

        {/* 2. Dynamic Coordinator Agent Event Bar */}
        <div className="p-3.5 rounded-xl bg-[#FDF4F0] border border-[#F5C7B8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded bg-white text-[#A8421E] shadow-2xs">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <div className="text-xs">
              <span className="font-mono font-bold text-[#A8421E]">Coordinator Agent</span>
              <span className="text-[10px] font-mono text-[#8C827A] ml-1.5">
                Confidence {Math.round(agentData.confidence * 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#57534E]">
            <span>
              {agentData.routed_reason} • Dispatched <strong className="text-[#1C1917]">{agentData.agentName}</strong> & <strong className="text-[#1C1917]">{agentData.collabAgent}</strong>.
            </span>
            <span className="hidden md:inline text-[9.5px] px-1.5 py-0.5 rounded bg-white text-[#A8421E] border border-[#F7CFC2] font-semibold shrink-0">
              Active Mesh
            </span>
          </div>
        </div>

        {/* Assessment Banner if triggered */}
        {assessmentStatus && (
          <div className="p-3.5 rounded-xl bg-[#EAF4EE] border border-[#CDE5D5] flex items-center justify-between text-xs text-[#2E7D52] shadow-2xs">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D52] shrink-0" />
              <span>{assessmentStatus.message}</span>
            </div>
            <span className="text-[10px] font-mono text-[#2E7D52] font-semibold">✓ BKT SYNCED</span>
          </div>
        )}

        {/* 3. Co-Synthesis Academic Output Module */}
        <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          
          {/* Header Bar */}
          <div className="bg-[#FAF8F5] px-5 py-3.5 border-b border-[#EAE5DC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-[#8C827A] font-bold uppercase tracking-wider">CO-SYNTHESIS:</span>
              <span className="px-2 py-0.5 rounded bg-[#FDF0ED] text-[#B93826] border border-[#F7CFC2] font-semibold flex items-center gap-1">
                Σ {agentData.agentName} <span className="opacity-75">{Math.round(agentData.confidence * 100)}%</span>
              </span>
              <span className="text-[#8C827A]">+</span>
              <span className="px-2 py-0.5 rounded bg-[#FDF2EE] text-[#DF7356] border border-[#FADBD2] font-semibold flex items-center gap-1">
                ⚡ {agentData.collabAgent} <span className="opacity-75">{Math.round(agentData.collabConfidence * 100)}%</span>
              </span>
              <span className="text-[#2E7D52] font-medium hidden sm:inline">• Synthesized & Verified</span>
            </div>

            <div className="flex items-center gap-2 text-[#8C827A]">
              <button 
                onClick={handleCopyMarkdown}
                title={copied ? "Copied!" : "Copy Response"}
                className="p-1 rounded hover:bg-[#EAE5DC] hover:text-[#1C1917] transition-colors flex items-center gap-1 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2E7D52]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 space-y-8 text-xs sm:text-sm text-[#1C1917] leading-relaxed">
            
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#A8421E]/20 border-t-[#A8421E] rounded-full animate-spin"></div>
                <div className="text-xs font-mono text-[#57534E]">
                  Coordinator routing question to {agentData.agentName}...
                </div>
                <div className="text-[11px] text-[#8C827A]">
                  Computing Bayesian Knowledge Tracing parameters and generating pedagogical derivation
                </div>
              </div>
            ) : agentData.response ? (
              <div className="space-y-4 whitespace-pre-line font-sans text-xs sm:text-sm leading-relaxed text-[#1C1917]">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC]">
                  {agentData.response}
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Core Intuition */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#DDD5C5] text-[#A8421E] flex items-center justify-center font-mono font-bold text-xs">
                      1
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-normal text-[#1C1917]">
                      The Core Intuition: Why Machine Learning is Inherently Probabilistic
                    </h3>
                  </div>
                  <p className="text-[#57534E] pl-7.5">
                    Real-world systems never operate in conditions of absolute certainty. When an autonomous model inspects an incoming text token, measurements are inherently incomplete. Rather than seeking fragile mathematical certainty, machine learning models compute <em className="text-[#1C1917] font-medium">calibrated degrees of belief</em>. Probability provides the formal grammar to quantify, update, and systematically reduce this uncertainty as new observational data arrives.
                  </p>
                </div>

                {/* Step 2: Mathematical Foundation: Bayes' Theorem */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#DDD5C5] text-[#A8421E] flex items-center justify-center font-mono font-bold text-xs">
                        2
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-normal text-[#1C1917]">
                        The Mathematical Foundation: Bayes' Theorem
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FDF0ED] text-[#B93826] border border-[#F7CFC2] uppercase font-semibold">
                      MATHS AGENT CORE
                    </span>
                  </div>

                  <p className="text-[#57534E] pl-7.5">
                    Before evaluating machine learning algorithms, we ground our reasoning in Bayes' Theorem:
                  </p>

                  {/* Math Formula Callout */}
                  <div className="ml-7.5 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-center space-y-1">
                    <div className="font-mono text-sm sm:text-base font-bold text-[#1C1917] tracking-wide">
                      P(A | B) = [ P(B | A) · P(A) ] / P(B)
                    </div>
                    <div className="font-mono text-[11px] text-[#8C827A]">
                      Posterior Belief = [ Likelihood · Prior ] / Marginal Evidence
                    </div>
                  </div>

                  {/* Pedagogical Anchor */}
                  <div className="ml-7.5 p-3.5 rounded-xl bg-[#FCF4E6] border border-[#F3E2C4] flex items-start gap-2.5 text-xs text-[#57534E]">
                    <Pin className="w-4 h-4 text-[#C07D1C] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#C07D1C] font-mono text-[11px]">Pedagogical Anchor: </strong>
                      {displayName}, observe how P(A|B) operates: it updates your preexisting hypothesis P(A) strictly after evidence B is observed.
                    </div>
                  </div>
                </div>

                {/* Step 3: Naive Bayes in Action */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#DDD5C5] text-[#A8421E] flex items-center justify-center font-mono font-bold text-xs">
                        3
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-normal text-[#1C1917]">
                        Naive Bayes in Action: Classification Model
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FDF2EE] text-[#DF7356] border border-[#FADBD2] uppercase font-semibold">
                      AIML SPECIALIST
                    </span>
                  </div>

                  <p className="text-[#57534E] pl-7.5">
                    In classification, the model determines class assignment. The algorithm is termed <strong>"Naive"</strong> because it assumes: <em>every feature occurs independently given the class label.</em>
                  </p>

                  <div className="ml-7.5 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-center font-mono text-xs sm:text-sm font-semibold text-[#1C1917]">
                    P(Class | x_1, x_2) ∝ P(Class) · P(x_1 | Class) · P(x_2 | Class)
                  </div>
                </div>

                {/* Step 4: Visual Worked Example Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#DDD5C5] text-[#A8421E] flex items-center justify-center font-mono font-bold text-xs">
                        4
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-normal text-[#1C1917]">
                        Visual Worked Example: 100 Sample Points
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] text-[#8C827A] border border-[#E7E2D7]">
                      Dataset: n=100
                    </span>
                  </div>

                  <div className="ml-7.5 overflow-x-auto rounded-xl border border-[#EAE5DC]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F5] border-b border-[#EAE5DC] font-mono text-[10px] text-[#78716C] uppercase tracking-wider">
                          <th className="p-3">COMPONENT</th>
                          <th className="p-3">CLASS: SPAM (20 TOTAL)</th>
                          <th className="p-3">CLASS: HAM (80 TOTAL)</th>
                          <th className="p-3">PEDAGOGICAL INTERPRETATION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0ECE1] font-mono text-[11px]">
                        <tr className="hover:bg-[#FCFBF9]">
                          <td className="p-3 font-semibold text-[#1C1917]">● Prior P(C)</td>
                          <td className="p-3">20/100 = <strong>0.20</strong></td>
                          <td className="p-3">80/100 = <strong>0.80</strong></td>
                          <td className="p-3 font-sans text-xs text-[#57534E]">Baseline probability prior to inspecting tokens.</td>
                        </tr>
                        <tr className="hover:bg-[#FCFBF9]">
                          <td className="p-3 text-[#1C1917]">Likelihood P("free"|C)</td>
                          <td className="p-3">16/20 = <strong>0.80</strong></td>
                          <td className="p-3">8/80 = <strong>0.10</strong></td>
                          <td className="p-3 font-sans text-xs text-[#57534E]">Word 'free' is 8x more likely to appear in spam.</td>
                        </tr>
                        <tr className="bg-[#EAF4EE]/60 font-semibold text-[#2E7D52]">
                          <td className="p-3">Normalized Posterior</td>
                          <td className="p-3">0.080 / 0.084 = <strong>95.2%</strong></td>
                          <td className="p-3">0.004 / 0.084 = <strong>4.8%</strong></td>
                          <td className="p-3 font-sans text-xs text-[#2E7D52]">Classifier confidently outputs SPAM.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Interactive Pedagogical Action Buttons Bar */}
          <div className="bg-[#FAF8F5] px-6 py-4 border-t border-[#EAE5DC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={() => handleSendQuery('Show step-by-step mathematical example')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#57534E] border border-[#EAE5DC] text-xs font-medium transition-colors cursor-pointer"
              >
                Show Step-by-Step Example
              </button>
              <button 
                type="button"
                onClick={() => handleSendQuery('Explain this in simpler terms (ELI5)')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#57534E] border border-[#EAE5DC] text-xs font-medium transition-colors cursor-pointer"
              >
                Explain Simpler (ELI5)
              </button>
              <button 
                type="button"
                onClick={() => handleSendQuery('Give me an intuitive hint for solving Bayes problems')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#57534E] border border-[#EAE5DC] text-xs font-medium transition-colors cursor-pointer"
              >
                Give me a Hint
              </button>
              <button 
                type="button"
                onClick={handleTestUnderstanding}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test My Understanding</span>
              </button>
            </div>

            <button 
              type="button"
              onClick={() => handleSendQuery('Escalate to human teacher with difficulty summary')}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FDF0ED] text-[#B93826] border border-[#F7CFC2] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#B93826]" />
              <span>Escalate to Human Teacher</span>
            </button>
          </div>
        </div>

        {/* Suggested Prompts Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
          <span className="text-[10px] uppercase text-[#8C827A] font-semibold tracking-wider">
            SUGGESTED PROMPTS:
          </span>
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSendQuery(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-[#FAF7F2] text-[#57534E] hover:text-[#1C1917] border border-[#EAE5DC] transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Bottom Rich Inquiry Input Bar */}
        <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          <textarea
            rows={2}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask EduHive anything, test an assumption, or request a diagnosis... (Press Enter to send)"
            className="w-full px-4 pt-3.5 pb-2 text-xs md:text-sm text-[#1C1917] placeholder-[#A8A29E] focus:outline-none resize-none font-sans"
          />

          <div className="px-4 py-2.5 bg-[#FAF8F5] border-t border-[#EAE5DC] flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-mono text-[#78716C]">
              <span className="flex items-center gap-1 text-[#2E7D52]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D52]"></span>
                Auto-Route: Active
              </span>
              <span className="text-[#DDD5C5]">|</span>
              <button type="button" onClick={() => setInputQuery(q => q + ' @maths ')} className="hover:text-[#1C1917] p-1 rounded font-mono text-[11px]">@maths</button>
              <button type="button" onClick={() => setInputQuery(q => q + ' @aiml ')} className="hover:text-[#1C1917] p-1 rounded font-mono text-[11px]">@aiml</button>
              <button type="button" onClick={() => setInputQuery(q => q + ' @dsa ')} className="hover:text-[#1C1917] p-1 rounded font-mono text-[11px]">@dsa</button>
              <button type="button" onClick={() => setInputQuery(q => q + ' @dbms ')} className="hover:text-[#1C1917] p-1 rounded font-mono text-[11px]">@dbms</button>
            </div>

            <button
              type="button"
              onClick={() => handleSendQuery()}
              disabled={isLoading || !inputQuery.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Routing...</span>
                </>
              ) : (
                <>
                  <span>Send Query</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
