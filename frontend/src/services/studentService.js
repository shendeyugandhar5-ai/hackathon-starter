/**
 * Student Service
 * Retrieves student mastery, agent trace telemetry, recommendations, and submits diagnostic assessments.
 */

import { api } from "./api";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export const studentService = {
  /**
   * Fetch mastery dashboard data for Student Brain
   */
  async getMastery(student_id) {
    if (!student_id) return { ok: false, error: "No student ID provided" };

    // 1. Try FastAPI backend endpoint
    const res = await api.get(`/api/students/${student_id}/mastery`);
    if (res.ok && res.data && res.data.topics && res.data.topics.length > 0) {
      return { ok: true, data: res.data };
    }

    // 2. Try Supabase direct query
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("student_mastery")
          .select("*")
          .eq("student_id", student_id);

        if (!error && data && data.length > 0) {
          const overall = Math.round(
            (data.reduce((acc, curr) => acc + (curr.score || 0), 0) /
              data.length) *
              100,
          );
          return {
            ok: true,
            data: {
              student_id,
              overall_score: overall / 100,
              topics: data,
              subjects: formatSubjectsFromTopics(data),
            },
          };
        }
      } catch (err) {
        console.warn("Direct Supabase mastery query note:", err);
      }
    }

    // 3. Personalized fallback for local/offline development
    return {
      ok: true,
      data: buildPersonalizedFallback(student_id),
      isDefault: true,
    };
  },

  /**
   * Fetch Agent Trace telemetry stream
   */
  async getTrace(student_id, limit = 20) {
    if (!student_id) return { ok: true, data: { entries: [] } };

    // 1. Try FastAPI endpoint
    const res = await api.get(
      `/api/students/${student_id}/trace?limit=${limit}`,
    );
    if (res.ok && res.data && res.data.entries && res.data.entries.length > 0) {
      return { ok: true, data: res.data };
    }

    // 2. Try Supabase direct query
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("agent_routing_log")
          .select("*")
          .eq("student_id", student_id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return { ok: true, data: { student_id, entries: data } };
        }
      } catch (err) {
        console.warn("Direct Supabase trace query note:", err);
      }
    }

    // 3. Fallback default trace events
    return {
      ok: true,
      data: {
        student_id,
        entries: [
          {
            id: "tr-01",
            agent: "maths",
            confidence: 0.95,
            message:
              "Explain Bayes Theorem formula derivation and conditional independence",
            routed_reason:
              "Trained router matched Maths Specialist (confidence 0.95)",
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          },
          {
            id: "tr-02",
            agent: "aiml",
            confidence: 0.87,
            message: "How does Naive Bayes handle spam email text features?",
            routed_reason: "Applied ML classification with Bayesian grounding",
            created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
          {
            id: "tr-03",
            agent: "dsa",
            confidence: 0.92,
            message:
              "Dynamic Programming subproblem recurrence for 0/1 Knapsack",
            routed_reason:
              "Algorithmic complexity analysis dispatched to DSA Agent",
            created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          },
        ],
      },
      isDefault: true,
    };
  },

  /**
   * Fetch recommendations
   */
  async getRecommendations(student_id, limit = 10) {
    if (!student_id) return { ok: true, data: { recommendations: [] } };
    const res = await api.get(
      `/api/students/${student_id}/recommendations?limit=${limit}`,
    );
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }
    return {
      ok: true,
      data: {
        student_id,
        recommendations: [
          {
            id: "rec-01",
            topic: "Conditional Probability Foundations",
            reason:
              "Prerequisite gap detected prior to Naive Bayes optimization",
            priority: "high",
            done: false,
          },
          {
            id: "rec-02",
            topic: "BKT Belief Updating Drill",
            reason: "Reinforce posterior derivation before gate checkpoint",
            priority: "normal",
            done: false,
          },
        ],
      },
      isDefault: true,
    };
  },

  /**
   * Submit knowledge check / assessment result (TEST -> DIAGNOSE -> ADAPT)
   */
  async submitAssessment(payload) {
    const res = await api.post("/api/assessments", payload);
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }

    // Direct fallback calculation
    return {
      ok: true,
      data: {
        assessment_id: "ass-" + Date.now(),
        is_correct: payload.is_correct,
        topic: payload.topic,
        previous_score: 0.42,
        new_score: payload.is_correct ? 0.62 : 0.35,
        state: payload.is_correct ? "learning" : "weak",
        misconception_logged: payload.is_correct
          ? null
          : payload.misconception_type || "Prior ignorance",
        escalate_to_human: false,
      },
      isDefault: true,
    };
  },
};

function formatSubjectsFromTopics(topics) {
  const groups = {};
  topics.forEach((t) => {
    if (!groups[t.subject]) groups[t.subject] = [];
    groups[t.subject].push(t);
  });

  return Object.keys(groups).map((subj) => {
    const items = groups[subj];
    const avg = items.reduce((a, b) => a + (b.score || 0), 0) / items.length;
    return {
      subject: subj,
      average_score: Math.round(avg * 100) / 100,
      topic_count: items.length,
      weak_topics: items
        .filter((i) => i.state === "weak" || i.score < 0.5)
        .map((i) => i.topic),
    };
  });
}

export default studentService;

function buildPersonalizedFallback(studentId) {
  const seed = Array.from(String(studentId)).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) % 997,
    7,
  );
  const adjust = (offset) => (((seed + offset) % 21) - 10) / 100;
  const topics = [
    ["maths", "conditional_probability", 0.42],
    ["maths", "bayes_theorem", 0.68],
    ["aiml", "naive_bayes_classifier", 0.67],
    ["dsa", "graph_traversals", 0.74],
    ["dbms", "sql_indexing", 0.92],
  ].map(([subject, topic, score], index) => {
    const personalizedScore = Math.min(
      0.98,
      Math.max(0.18, score + adjust(index * 13)),
    );
    return {
      subject,
      topic,
      score: personalizedScore,
      state:
        personalizedScore >= 0.8
          ? "mastered"
          : personalizedScore < 0.5
            ? "weak"
            : "learning",
      attempts: Math.max(1, Math.round(2 + ((seed + index) % 4))),
      source: "personalized-default",
    };
  });

  return {
    student_id: studentId,
    overall_score:
      topics.reduce((sum, topic) => sum + topic.score, 0) / topics.length,
    subjects: formatSubjectsFromTopics(topics),
    topics,
  };
}
