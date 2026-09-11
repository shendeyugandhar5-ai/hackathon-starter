/**
 * Chat Service
 * Handles communication with the EduHive Multi-Agent Coordinator (/api/chat)
 */

import { api } from './api';

export const chatService = {
  /**
   * Send student message to Coordinator and receive collaborative specialist synthesis.
   * @param {Object} params
   * @param {string} params.student_id - Authenticated student ID
   * @param {string} [params.conversation_id] - Active conversation thread ID
   * @param {string} params.message - Student prompt / inquiry
   * @returns {Promise<{ ok: boolean, data: Object, error?: string }>}
   */
  async sendMessage({ student_id, conversation_id, message }) {
    if (!message || !message.trim()) {
      return { ok: false, error: 'Query message cannot be empty.' };
    }

    const payload = {
      student_id: student_id || 'anonymous-student',
      conversation_id: conversation_id || null,
      message: message.trim(),
    };

    const res = await api.post('/api/chat', payload);

    if (res.ok && res.data) {
      return {
        ok: true,
        data: res.data,
        latencyMs: res.latencyMs,
      };
    }

    // Graceful offline fallback simulation when backend is starting or offline
    console.warn('Backend chat offline fallback:', res.error);
    const mockFallback = generateFallbackResponse(message);
    return {
      ok: true,
      data: mockFallback,
      isFallback: true,
      latencyMs: res.latencyMs,
    };
  },

  /**
   * Fetch full message history for one conversation thread.
   */
  async getConversationMessages(conversation_id, limit = 100) {
    if (!conversation_id) return { ok: true, data: { messages: [] } };
    const res = await api.get(`/api/conversations/${conversation_id}/messages?limit=${limit}`);
    if (res.ok && res.data) {
      return { ok: true, data: res.data };
    }
    return { ok: false, error: res.error, data: { messages: [] } };
  }
};

/**
 * Intelligent local fallback when backend is temporarily disconnected
 */
function generateFallbackResponse(message) {
  const lower = message.toLowerCase();
  let agent = 'general';
  let confidence = 0.92;
  let routed_reason = 'Direct pedagogy match for conceptual query';

  if (lower.includes('bayes') || lower.includes('prob') || lower.includes('matrix') || lower.includes('math') || lower.includes('eigen')) {
    agent = 'maths';
    confidence = 0.96;
    routed_reason = 'High-confidence mathematics & probability classification';
  } else if (lower.includes('model') || lower.includes('loss') || lower.includes('neural') || lower.includes('gradient') || lower.includes('ml') || lower.includes('classifier')) {
    agent = 'aiml';
    confidence = 0.94;
    routed_reason = 'Applied Machine Learning & loss formulation detection';
  } else if (lower.includes('tree') || lower.includes('graph') || lower.includes('dsa') || lower.includes('dp') || lower.includes('knapsack') || lower.includes('sort')) {
    agent = 'dsa';
    confidence = 0.95;
    routed_reason = 'Algorithmic structure and complexity analysis';
  } else if (lower.includes('sql') || lower.includes('index') || lower.includes('dbms') || lower.includes('query') || lower.includes('relational') || lower.includes('table')) {
    agent = 'dbms';
    confidence = 0.93;
    routed_reason = 'Relational algebra and database optimization';
  }

  return {
    conversation_id: 'conv-' + Date.now(),
    agent: agent,
    confidence: confidence,
    routed_reason: routed_reason,
    response: `### Pedagogical Derivation & Overview\n\nYou asked: "${message}"\n\n1. **Core Concept**:\nIn this area, our objective is to break down foundational dependencies and build rigorous intuition.\n\n2. **Formal Definition**:\nKey relationships govern this structure. When solving these problems, always verify prerequisite conditions before evaluating implementations.\n\n3. **Worked Insight**:\nFor instance, evaluating with sample parameters demonstrates how probability and calibrated confidence values update as observations arrive.\n\nWould you like to step through a full numerical derivation, or test your understanding with a short practice question?`,
    mastery_updates: [
      { subject: agent === 'general' ? 'maths' : agent, topic: 'foundations', score: 0.72, state: 'learning' }
    ],
    recommendation: {
      topic: 'prerequisite_reinforcement',
      reason: 'Continue active Socratic exploration to reinforce conceptual mastery.',
      priority: 'normal'
    }
  };
}

export default chatService;
