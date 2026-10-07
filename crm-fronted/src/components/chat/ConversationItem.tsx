import React from 'react';
import type { Conversation } from '../../lib/constants';

interface Props {
  conversation: Conversation;
  selected: boolean;
  onSelect: (c: Conversation) => void;
}

const initials = (name?: string) =>
  (name || 'C')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const ConversationItem: React.FC<Props> = ({ conversation, selected, onSelect }) => {
  const statusColor =
    conversation.status === 'transferred'
      ? 'bg-[color:var(--color-warning)]/100'
      : conversation.status === 'active'
      ? 'bg-[var(--color-success)]/100'
      : 'bg-slate-400';

  const lastTime = conversation.last_message?.created_at
    ? new Date(conversation.last_message.created_at).toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Ahora';

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`group flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left transition ${
        selected
          ? 'bg-[var(--color-primary-soft)] text-[var(--color-text)] shadow-[inset_4px_0_0_var(--color-primary)]'
          : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-background)]'
      }`}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)] ring-1 ring-[var(--color-primary-border)]">
        {initials(conversation.client?.name)}
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[var(--color-surface)] ${statusColor}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-sm font-semibold ${
              selected ? 'text-[var(--color-text)]' : 'text-[var(--color-text)]'
            }`}
          >
            {conversation.client?.name || 'Cliente'}
          </p>
          <span className="text-[10px] text-[var(--color-text-muted)]">{lastTime}</span>
        </div>
        <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
          {conversation.last_message?.text || 'Sin mensajes recientes'}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {(conversation.tags || [conversation.priority]).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-md bg-[var(--color-background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
              {tag}
            </span>
          ))}
          {Boolean(conversation.unread_count) && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-black text-white">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
