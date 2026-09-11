/**
 * Student data service.
 *
 * Important: dashboard data is NEVER replaced with the Rahul/demo dataset.
 * A learner with no records gets an empty, genuinely new state. Once the
 * backend records assessments/chat activity, the same student id receives
 * only that student's data.
 */
import { api } from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const studentService = {
  async getMastery(student_id) {
    if (!student_id) return { ok: false, error: 'No student ID provided' };

    const res = await api.get(`/api/students/${student_id}/mastery`);
    if (res.ok && res.data) return { ok: true, data: normalizeMastery(res.data) };

    // Browser-direct fallback when Supabase is configured.
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('student_mastery')
          .select('*')
          .eq('student_id', student_id)
          .order('score', { ascending: true });

        if (!error) {
          return { ok: true, data: buildMasteryResponse(student_id, data || []) };
        }
      } catch (err) {
        console.warn('Supabase mastery query failed:', err);
      }
    }

    // Offline/cold-start state. Do not inject demo values.
    return { ok: true, data: buildMasteryResponse(student_id, []), isDefault: true };
  },

  async getTrace(student_id, limit = 20) {
    if (!student_id) return { ok: true, data: { student_id, entries: [] } };

    const res = await api.get(`/api/students/${student_id}/trace?limit=${limit}`);
    if (res.ok && res.data) return { ok: true, data: res.data };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('agent_routing_log')
          .select('*')
          .eq('student_id', student_id)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error) return { ok: true, data: { student_id, entries: data || [] } };
      } catch (err) {
        console.warn('Supabase trace query failed:', err);
      }
    }

    return { ok: true, data: { student_id, entries: [] }, isDefault: true };
  },

  async getRecommendations(student_id, limit = 10) {
    if (!student_id) return { ok: true, data: { recommendations: [] } };
    const res = await api.get(`/api/students/${student_id}/recommendations?limit=${limit}`);
    if (res.ok && res.data) return { ok: true, data: res.data };
    return { ok: true, data: { student_id, recommendations: [] }, isDefault: true };
  },

  async submitAssessment(payload) {
    const res = await api.post('/api/assessments', payload);
    if (res.ok && res.data) return { ok: true, data: res.data };
    return { ok: false, error: res.error || 'Assessment could not be saved.' };
  },
};

function buildMasteryResponse(student_id, topics) {
  const rows = Array.isArray(topics) ? topics : [];
  return {
    student_id,
    overall_score: rows.length
      ? rows.reduce((sum, row) => sum + Number(row.score || 0), 0) / rows.length
      : 0,
    subjects: formatSubjectsFromTopics(rows),
    topics: rows,
  };
}

function normalizeMastery(data) {
  return buildMasteryResponse(data.student_id, data.topics || []);
}

function formatSubjectsFromTopics(topics) {
  const groups = {};
  topics.forEach((topic) => {
    if (!topic.subject) return;
    (groups[topic.subject] ||= []).push(topic);
  });

  return Object.entries(groups).map(([subject, items]) => {
    const average_score = items.reduce((sum, item) => sum + Number(item.score || 0), 0) / items.length;
    return {
      subject,
      average_score: Number(average_score.toFixed(4)),
      topic_count: items.length,
      weak_topics: items
        .filter((item) => item.state === 'weak' || Number(item.score) < 0.5)
        .map((item) => item.topic),
    };
  });
}

export default studentService;
