import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { mockMessages, type Message } from '../lib/constants';

const demoDataEnabled = String(import.meta.env.VITE_USE_DEMO_DATA || '').toLowerCase() === 'true';
const fallbackMessages = demoDataEnabled ? mockMessages : {};

export const useMessages = (conversationId?: number, pollMs = 5000) => {
  const [messages, setMessages] = useState<Message[]>(() =>
    conversationId ? fallbackMessages[conversationId] ?? [] : []
  );
  const loadingRef = useRef<number | null>(null);

  const load = useCallback(async (id?: number) => {
    if (!id || loadingRef.current === id) return;
    loadingRef.current = id;
    try {
      const result = await api.getOperatorMessages(String(id));
      const next = Array.isArray(result.data) ? result.data : [];
      setMessages(next.length ? next : fallbackMessages[id] ?? []);
    } catch {
      setMessages((current) => (current.length ? current : fallbackMessages[id] ?? []));
    } finally {
      loadingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    setMessages((current) => (current.length ? current : fallbackMessages[conversationId] ?? []));
    load(conversationId);
    const timer = window.setInterval(() => load(conversationId), pollMs);
    return () => window.clearInterval(timer);
  }, [conversationId, load, pollMs]);

  return { messages, setMessages, reload: () => load(conversationId) };
};
