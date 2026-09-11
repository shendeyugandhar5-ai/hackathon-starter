/**
 * API Service Layer
 * Centralized HTTP client for the LearnOS / EduHive FastAPI backend.
 *
 * Every method returns { ok, status, latencyMs, data, error } — never throws,
 * so components can render an error state instead of crashing the tree.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = data && data.detail;
      const errMsg =
        (typeof detail === 'string' && detail) ||
        (data && data.message) ||
        `HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return { ok: true, status: response.status, latencyMs, data };
  } catch (error) {
    return {
      ok: false,
      status: error.status || 0,
      latencyMs: Math.round(performance.now() - startTime),
      error: error.message || 'Failed to connect to backend',
      data: null,
    };
  }
}

const get = (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options });
const post = (endpoint, body, options = {}) =>
  request(endpoint, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
const put = (endpoint, body, options = {}) =>
  request(endpoint, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
const del = (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options });

export const api = {
  baseUrl: API_BASE_URL,

  // ---------------------------------------------------------------- core --
  getRoot: () => get('/'),
  getHealth: () => get('/api/health'),

  /** All five agents with label + scope. */
  getAgents: () => get('/api/agents'),

  // ---------------------------------------------------------------- chat --
  /**
   * The main endpoint. Pass conversationId to continue an existing thread —
   * the backend feeds the last 6 turns back into the agent's context.
   *
   * Returns: { conversation_id, agent, confidence, routed_reason, response,
   *            mastery_updates, recommendation, contributing_agents, context_used }
   */
  sendMessage: ({ studentId, message, conversationId = null, image = null }) =>
    post('/api/chat', {
      student_id: studentId,
      message,
      conversation_id: conversationId,
      // Data URL of a photographed/screenshotted question, when attached
      image,
    }),

  // ------------------------------------------------------------ students --
  createStudent: ({ id, name = null, goal = null }) =>
    post('/api/students', { id, name, goal }),

  getStudent: (studentId) => get(`/api/students/${studentId}`),

  /** Student Brain dashboard: per-topic scores/states + per-subject rollup. */
  getMastery: (studentId) => get(`/api/students/${studentId}/mastery`),

  /** Agent Trace panel: every routing decision, newest first. */
  getTrace: (studentId, limit = 20) =>
    get(`/api/students/${studentId}/trace?limit=${limit}`),

  /** Next-best-action, recomputed live from current mastery. */
  getRecommendations: (studentId, limit = 10) =>
    get(`/api/students/${studentId}/recommendations?limit=${limit}`),

  /** Cross-subject prerequisite gaps — which weak topic is blocking what. */
  getRootCause: (studentId) => get(`/api/students/${studentId}/root-cause`),

  // ------------------------------------------------------- conversations --
  getConversations: (studentId, limit = 20) =>
    get(`/api/students/${studentId}/conversations?limit=${limit}`),

  getMessages: (conversationId, limit = 100) =>
    get(`/api/conversations/${conversationId}/messages?limit=${limit}`),

  // ---------------------------------------------------------- assessment --
  /** Generate a quiz question. Omit topic to auto-target the root cause. */
  getKnowledgeCheck: ({ studentId, subject = null, topic = null }) =>
    post('/api/knowledge-check', { student_id: studentId, subject, topic }),

  /**
   * Submit an answer. Returns previous_score -> new_score (BKT), new state,
   * the typed misconception logged, and escalate_to_human.
   */
  submitAssessment: (payload) => post('/api/assessments', payload),

  // ------------------------------------------------------------- generic --
  get,
  post,
  put,
  delete: del,
};

/** Valid misconception types, mirroring the backend taxonomy. */
export const MISCONCEPTION_TYPES = [
  'sign_error',
  'unit_confusion',
  'definition_confusion',
  'off_by_one',
  'base_case_missing',
  'formula_misapplication',
  'logic_error',
  'other',
];

/**
 * Display metadata per agent. Mirrors `specialistAgents` in data/mockData.js
 * so live backend data and any remaining static UI stay visually consistent.
 */
export const AGENT_STYLES = {
  coordinator: { label: 'Coordinator', color: '#A8421E', bg: '#FDF4F0' },
  dsa: { label: 'DSA', color: '#C07D1C', bg: '#FCF4E6' },
  dbms: { label: 'DBMS', color: '#3B7A8C', bg: '#EEF6F8' },
  maths: { label: 'Maths', color: '#B93826', bg: '#FDF0ED' },
  aiml: { label: 'AIML', color: '#DF7356', bg: '#FDF2EE' },
  general: { label: 'General', color: '#57534E', bg: '#F5F5F4' },
};

/** Mastery state -> display color, matching the dashboard palette. */
export const STATE_STYLES = {
  new: { label: 'New', color: '#8C827A', bg: '#F5F5F4' },
  learning: { label: 'Learning', color: '#C07D1C', bg: '#FCF4E6' },
  weak: { label: 'Weak', color: '#B93826', bg: '#FDF0ED' },
  mastered: { label: 'Mastered', color: '#1C6B5A', bg: '#E9F5F1' },
};

export default api;
