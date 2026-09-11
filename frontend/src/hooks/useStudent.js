/**
 * Student data hooks: mastery, agent trace, recommendations, root cause,
 * and conversation history.
 *
 * All of these share a refresh trigger so a chat turn or a submitted
 * assessment can refresh the whole dashboard at once.
 */
import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

/** Generic fetch-on-mount wrapper with manual refresh. */
function useEndpoint(fetcher, deps, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetcher();
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

/**
 * Student Brain dashboard data.
 * Returns topics (per-topic mastery) and subjects (per-subject rollup).
 */
export function useMastery(studentId) {
  const { data, loading, error, refresh } = useEndpoint(
    () => api.getMastery(studentId),
    [studentId]
  );

  const topics = data?.topics || [];
  const subjects = data?.subjects || [];
  const overall = data?.overall_score ?? 0;

  return {
    topics,
    subjects,
    overall,
    overallPercent: Math.round(overall * 100),
    weakTopics: topics.filter((t) => t.state === 'weak'),
    masteredTopics: topics.filter((t) => t.state === 'mastered'),
    loading,
    error,
    refresh,
  };
}

/** Agent Trace panel: recent routing decisions. */
export function useTrace(studentId, limit = 20) {
  const { data, loading, error, refresh } = useEndpoint(
    () => api.getTrace(studentId, limit),
    [studentId, limit]
  );
  return { entries: data?.entries || [], loading, error, refresh };
}

/** Personalized next-best-action recommendations. */
export function useRecommendations(studentId, limit = 10) {
  const { data, loading, error, refresh } = useEndpoint(
    () => api.getRecommendations(studentId, limit),
    [studentId, limit]
  );
  return { recommendations: data?.recommendations || [], loading, error, refresh };
}

/**
 * Cross-subject prerequisite gaps — the root-cause differentiator.
 * `summary` is a ready-to-render sentence explaining the top gap.
 */
export function useRootCause(studentId) {
  const { data, loading, error, refresh } = useEndpoint(
    () => api.getRootCause(studentId),
    [studentId]
  );
  return {
    gaps: data?.gaps || [],
    summary: data?.summary || null,
    topGap: data?.gaps?.[0] || null,
    loading,
    error,
    refresh,
  };
}

/** Conversation list for the History page / sidebar. */
export function useConversations(studentId, limit = 20) {
  const { data, loading, error, refresh } = useEndpoint(
    () => api.getConversations(studentId, limit),
    [studentId, limit]
  );
  return { conversations: data || [], loading, error, refresh };
}

/** The five agents and what each covers. */
export function useAgents() {
  const { data, loading, error } = useEndpoint(() => api.getAgents(), []);
  return { agents: data || [], loading, error };
}

/** Profile summary: overall score, topic counts, conversation count. */
export function useStudentProfile(studentId) {
  const { data, loading, error, refresh } = useEndpoint(
    () => api.getStudent(studentId),
    [studentId]
  );
  return { profile: data, loading, error, refresh };
}

/**
 * The TEACH -> TEST -> DIAGNOSE -> ADAPT loop.
 * `generate()` auto-targets the student's root-cause topic when none is given.
 */
export function useKnowledgeCheck(studentId) {
  const [question, setQuestion] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(
    async ({ subject = null, topic = null } = {}) => {
      setBusy(true);
      setResult(null);
      const res = await api.getKnowledgeCheck({ studentId, subject, topic });
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return null;
      }
      setQuestion(res.data);
      setError(null);
      return res.data;
    },
    [studentId]
  );

  const submit = useCallback(
    async ({ studentAnswer, isCorrect, confidenceRating = null, misconceptionType = null }) => {
      if (!question) return null;
      setBusy(true);
      const res = await api.submitAssessment({
        student_id: studentId,
        subject: question.subject,
        topic: question.topic,
        question: question.question,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        confidence_rating: confidenceRating,
        misconception_type: misconceptionType,
      });
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return null;
      }
      setResult(res.data);
      return res.data;
    },
    [studentId, question]
  );

  return { question, result, busy, error, generate, submit };
}
