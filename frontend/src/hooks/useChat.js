/**
 * Chat state for the Tutor page.
 *
 * Owns the message list, the active conversation thread, and the routing
 * metadata each answer carries (agent, confidence, routed_reason,
 * contributing_agents, context_used) — that metadata is what the Agent
 * Trace panel renders.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

export function useChat(studentId) {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  /** Routing metadata from the most recent answer. */
  const [lastTrace, setLastTrace] = useState(null);

  const idRef = useRef(0);
  const nextId = () => `m${++idRef.current}`;

  const send = useCallback(
    async (text, image = null) => {
      const trimmed = (text || '').trim();
      // Either words or an image is enough to ask a question
      if ((!trimmed && !image) || sending || !studentId) return null;

      setError(null);
      setSending(true);

      const studentMsg = {
        id: nextId(),
        role: 'student',
        content: trimmed,
        imageUrl: image?.dataUrl || null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, studentMsg]);

      const res = await api.sendMessage({
        studentId,
        message: trimmed,
        conversationId,
        image: image?.dataUrl || null,
      });

      setSending(false);

      if (!res.ok) {
        setError(res.error);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'agent',
            agent: 'general',
            content: `Could not reach the tutor: ${res.error}`,
            isError: true,
            createdAt: new Date().toISOString(),
          },
        ]);
        return null;
      }

      const d = res.data;
      if (d.conversation_id && d.conversation_id !== conversationId) {
        setConversationId(d.conversation_id);
      }

      const trace = {
        agent: d.agent,
        confidence: d.confidence,
        routedReason: d.routed_reason,
        contributingAgents: d.contributing_agents || [d.agent],
        contextUsed: d.context_used || null,
        recommendation: d.recommendation || null,
        latencyMs: res.latencyMs,
        // Real execution record from the LangGraph orchestration
        events: d.trace_events || [],
        teachingStrategy: d.teaching_strategy || null,
        supportingAgents: d.supporting_agents || [],
        retrievedContext: d.retrieved_context || [],
        verification: d.verification || null,
        knowledgeCheck: d.knowledge_check || null,
      };
      setLastTrace(trace);

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'agent',
          agent: d.agent,
          content: d.response,
          trace,
          createdAt: new Date().toISOString(),
        },
      ]);

      return d;
    },
    [studentId, conversationId, sending]
  );

  /** Load an earlier thread from History and continue it. */
  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    const res = await api.getMessages(id);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConversationId(id);
    setMessages(
      (res.data.messages || []).map((m) => ({
        id: m.id || nextId(),
        role: m.role,
        agent: m.agent,
        content: m.content,
        createdAt: m.created_at,
      }))
    );
  }, []);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setLastTrace(null);
    setError(null);
  }, []);

  return {
    messages,
    conversationId,
    sending,
    error,
    lastTrace,
    send,
    loadConversation,
    startNewConversation,
  };
}

/** Backend reachability + latency, for a status indicator. */
export function useBackendHealth(pollMs = 0) {
  const [health, setHealth] = useState({ online: null, database: null, latencyMs: null });

  const check = useCallback(async () => {
    const res = await api.getHealth();
    setHealth({
      online: res.ok,
      database: res.ok ? res.data.database : null,
      latencyMs: res.latencyMs,
    });
  }, []);

  useEffect(() => {
    check();
    if (!pollMs) return undefined;
    const t = setInterval(check, pollMs);
    return () => clearInterval(t);
  }, [check, pollMs]);

  return { ...health, refresh: check };
}

export default useChat;
