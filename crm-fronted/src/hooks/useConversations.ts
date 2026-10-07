import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { conversationActivityTime, mockConversations, type Conversation } from '../lib/constants';

interface UseConversationsOptions {
  onNewMessage?: (conversation: Conversation) => void;
  pollMs?: number;
}

const demoDataEnabled = String(import.meta.env.VITE_USE_DEMO_DATA || '').toLowerCase() === 'true';
const fallbackConversations = demoDataEnabled ? mockConversations : [];

export const useConversations = ({
  onNewMessage,
  pollMs = 8000,
}: UseConversationsOptions = {}) => {
  const [conversations, setConversations] = useState<Conversation[]>(fallbackConversations);
  const [active, setActive] = useState<Conversation | null>(fallbackConversations[0] ?? null);
  const loadingRef = useRef(false);
  const latestInboundRef = useRef<Map<number, number> | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const next = await api.getOperatorConversations();

      const seen = new Map<number, number>();
      next.forEach((conversation: Conversation) => {
        const inboundId = Number(conversation.latest_inbound_id || 0);
        seen.set(conversation.id, inboundId);
        if (latestInboundRef.current && inboundId > (latestInboundRef.current.get(conversation.id) || 0)) {
          onNewMessageRef.current?.(conversation);
        }
      });
      latestInboundRef.current = seen;

      const ordered = [...next].sort(
        (a, b) => conversationActivityTime(b) - conversationActivityTime(a)
      );

      setConversations(ordered.length ? ordered : fallbackConversations);
      setActive((current) => {
        const source = ordered.length ? ordered : fallbackConversations;
        if (!current) return source[0] ?? null;
        return source.find((c) => c.id === current.id) ?? source[0] ?? null;
      });
    } catch {
      setConversations((current) => (current.length ? current : fallbackConversations));
      setActive((current) => current ?? fallbackConversations[0] ?? null);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, pollMs);
    return () => window.clearInterval(timer);
  }, [load, pollMs]);

  const counts = useMemo(() => {
    const pending = conversations.filter((c) => c.status === 'transferred').length;
    const attention = conversations.filter(
      (c) => c.status === 'active' && c.priority === 'high'
    ).length;
    const active = conversations.filter((c) => c.status === 'active').length;
    const closed = conversations.filter((c) =>
      ['closed', 'finished'].includes(c.status)
    ).length;

    return { all: conversations.length, pending, attention, active, closed };
  }, [conversations]);

  return { conversations, setConversations, active, setActive, counts, reload: load };
};
