import React, { useEffect, useRef } from 'react';
import { Filter, Search } from 'lucide-react';
import type { ChatFilter, Conversation, Message, SidebarCounts } from '../../lib/constants';
import { messageDay } from '../../lib/constants';
import { ConversationItem } from './ConversationItem';
import { MessageBubble } from './MessageBubble';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: number;
  onSelect: (conversation: Conversation) => void;
  query: string;
  setQuery: (value: string) => void;
  filter: ChatFilter;
  setFilter: (value: ChatFilter) => void;
  counts: SidebarCounts;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  query,
  setQuery,
  filter,
  setFilter,
  counts,
}) => {
  const filters: Array<[ChatFilter, string, number]> = [
    ['all', 'Todas', counts.all],
    ['pending', 'Pendientes', counts.pending],
    ['attention', 'En atención', counts.attention],
    ['active', 'Activas', counts.active],
    ['closed', 'Cerradas', counts.closed],
  ];

  return (
    <aside className="flex min-h-[calc(100vh-112px)] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">Conversaciones</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Bandeja única con IA y atención humana.</p>
          </div>
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            {counts.all}
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o mensaje..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map(([value, label, total]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold ${
                filter === value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_10px_22px_rgba(22,199,102,0.2)]'
                  : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {label}
              <span className={filter === value ? 'text-white' : 'text-[var(--color-text)]'}>{total}</span>
            </button>
          ))}
          <button
            type="button"
            title="Más filtros"
            className="inline-flex h-[34px] w-[38px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)]"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No hay conversaciones.</p>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              selected={conversation.id === activeId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
};

interface MessageListProps {
  messages: Message[];
  conversationId?: number;
  searchQuery?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  conversationId,
  searchQuery = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const visible = searchQuery.trim()
    ? messages.filter((m) =>
        (m.content || m.text).toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : messages;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.scrollTop = panel.scrollHeight;
  }, [conversationId]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const distance = panel.scrollHeight - panel.scrollTop - panel.clientHeight;
    if (distance < 180) panel.scrollTop = panel.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={panelRef}
      className="flex-1 overflow-y-auto bg-[var(--color-chat)] p-4"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)',
        backgroundSize: '22px 22px',
      }}
    >
      {visible.map((message, index) => {
        const previous = visible[index - 1];
        const newDay =
          !previous || messageDay(previous.created_at) !== messageDay(message.created_at);
        return (
          <div key={message.id} className="mb-3">
            {newDay && (
              <div className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {messageDay(message.created_at)}
              </div>
            )}
            <MessageBubble message={message} />
          </div>
        );
      })}
      {visible.length === 0 && (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          {searchQuery ? 'Sin resultados.' : 'No hay mensajes todavía.'}
        </p>
      )}
    </div>
  );
};
