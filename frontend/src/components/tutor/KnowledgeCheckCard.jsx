import { useTranslation } from '../../i18n';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import api, { MISCONCEPTION_TYPES } from '../../services/api';

/**
 * Knowledge check — the TEST half of TEACH -> TEST -> DIAGNOSE -> ADAPT.
 *
 * Submitting an answer runs the existing assessment endpoint, which updates
 * mastery through the Progress Engine (BKT), logs a typed misconception on
 * a wrong answer, and can escalate to a human teacher.
 */
export default function KnowledgeCheckCard({ check, studentId, onGraded }) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!check?.question) return null;

  const submit = async (isCorrect) => {
    if (busy) return;
    setBusy(true);
    setError(null);

    const res = await api.submitAssessment({
      student_id: studentId,
      subject: check.subject,
      topic: check.topic,
      question: check.question,
      student_answer: answer || '(self-assessed)',
      is_correct: isCorrect,
      confidence_rating: confidence,
      misconception_type: isCorrect ? null : 'other',
    });

    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.data);
    onGraded?.(res.data);
  };

  return (
    <div className="rounded-xl border border-[#C07D1C]/30 bg-[#FCF4E6] p-4">
      <div className="flex items-center gap-1.5">
        <HelpCircle className="h-3.5 w-3.5 text-[#C07D1C]" />
        <h4 className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#C07D1C]">
          Quick check
          {check.topic && ` · ${check.topic.replace(/_/g, ' ')}`}
        </h4>
      </div>

      <p className="mt-2 font-sans text-sm leading-relaxed text-[#1C1917]">
        {check.question}
      </p>

      {!result ? (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            placeholder={t('check.yourAnswer')}
            className="mt-2.5 w-full resize-none rounded-lg border border-[#EAE5DC] bg-white px-2.5 py-2 font-sans text-xs text-[#1C1917] outline-none focus:border-[#A8421E]"
          />

          <div className="mt-2 flex items-center gap-2">
            <span className="font-sans text-[10px] text-[#57534E]">{t('check.howSure')}</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setConfidence(n)}
                className={`h-5 w-5 rounded font-mono text-[10px] transition-colors ${
                  confidence === n
                    ? 'bg-[#C07D1C] text-white'
                    : 'bg-white text-[#57534E] hover:bg-[#F2ECE0]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {error && <p className="mt-2 font-sans text-[11px] text-red-600">{error}</p>}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1C6B5A] px-3 py-1.5 font-sans text-[11px] font-semibold text-white disabled:opacity-40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> {t('check.gotItRight')}
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#B93826] px-3 py-1.5 font-sans text-[11px] font-semibold text-white disabled:opacity-40"
            >
              <XCircle className="h-3.5 w-3.5" /> {t('check.gotItWrong')}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-lg border border-[#EAE5DC] bg-white p-3">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
            {t('check.masteryUpdated')}
          </p>
          {result.new_score != null ? (
            <p className="mt-1 font-sans text-xs text-[#1C1917]">
              {check.topic?.replace(/_/g, ' ')}:{' '}
              <span className="font-mono">
                {Math.round((result.previous_score ?? 0) * 100)}% →{' '}
                {Math.round(result.new_score * 100)}%
              </span>
              {result.state && (
                <span className="ml-1.5 font-semibold text-[#57534E]">({result.state})</span>
              )}
            </p>
          ) : (
            <p className="mt-1 font-sans text-xs text-[#57534E]">{t('check.recorded')}</p>
          )}

          {result.escalate_to_human && (
            <p className="mt-2 rounded bg-[#FDF0ED] p-2 font-sans text-[11px] text-[#B93826]">
              {result.escalation_reason ||
                'You have attempted this several times — a teacher may help more than another explanation.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
