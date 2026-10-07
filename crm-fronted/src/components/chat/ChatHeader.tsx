import React from 'react';
import { Bot, CheckCircle2, MoreHorizontal, Phone, Search, Ticket, UserCheck } from 'lucide-react';
import type { Conversation } from '../../lib/constants';

interface Props {
  conversation: Conversation;
  onToggleClientPanel: () => void;
  onToggleSearch: () => void;
}

export const ChatHeader: React.FC<Props> = ({
  conversation,
  onToggleClientPanel,
  onToggleSearch,
}) => {
  const initials = (conversation.client?.name || 'C')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      <button type="button" onClick={onToggleClientPanel} className="flex items-center gap-3 text-left">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)] ring-1 ring-[var(--color-primary-border)]">
          {initials}
        </div>
        <div>
          <h2 className="max-w-[220px] truncate text-base font-semibold text-[var(--color-text)]">
            {conversation.client?.name || 'Nombre pendiente'}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-success)]/100" />
            <span>En línea</span>
            <span className="hidden xl:inline">·</span>
            <span className="hidden whitespace-nowrap xl:inline">{conversation.client?.whatsapp_number || '+591 70000000'}</span>
            <span className="hidden whitespace-nowrap rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 font-semibold text-[var(--color-primary)] sm:inline">
              {conversation.ai_mode || 'AI_ASSIST'}
            </span>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-2">
        <ActionIcon title="Tomar conversación">
          <UserCheck className="h-4 w-4" />
        </ActionIcon>
        <ActionIcon title="Crear ticket">
          <Ticket className="h-4 w-4" />
        </ActionIcon>
        <ActionIcon title="IA asistida">
          <Bot className="h-4 w-4" />
        </ActionIcon>
        <button
          onClick={onToggleSearch}
          title="Buscar en el chat"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
        >
          <Search className="h-4 w-4" />
        </button>
        <button title="Llamar" className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          <Phone className="h-4 w-4" />
        </button>
        <button title="Cerrar conversación" className="hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] sm:block">
          <CheckCircle2 className="h-4 w-4" />
        </button>
        <button title="Más opciones" className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ActionIcon: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <button
    title={title}
    className="hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] lg:block"
  >
    {children}
  </button>
);
