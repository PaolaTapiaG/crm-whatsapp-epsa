// src/components/chat/MobileLayout.tsx
import React from 'react';
import { Bell, Menu, Paperclip, Search, Send } from 'lucide-react';
import type {
  ChatFilter,
  Conversation,
  Message,
  MobileView,
  SidebarCounts,
} from '../../lib/constants';
import { ConversationItem } from './ConversationItem';
import { MessageBubble } from './MessageBubble';

interface Props {
  mobileView: MobileView;
  setMobileView: (v: MobileView) => void;
  active: Conversation | null;
  filteredConversations: Conversation[];
  onSelect: (c: Conversation) => void;
  messages: Message[];
  text: string;
  setText: (v: string) => void;
  onSend: () => void;
  onAttachment: (file: File) => void;
  query: string;
  setQuery: (v: string) => void;
  filter: ChatFilter;
  setFilter: (f: ChatFilter) => void;
  counts: SidebarCounts;
  chatSearch: string;
  setChatSearch: (v: string) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  onEnableNotifications: () => void;
  onOpenMenu: () => void;
  onRequestClose: () => void;
  onChangeStatus: (status: 'transferred') => void;
  onInternalNote: (note: string) => void;
}

const initials = (name?: string) =>
  (name || 'C')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const MobileLayout: React.FC<Props> = (props) => {
  const {
    mobileView,
    setMobileView,
    active,
    filteredConversations,
    onSelect,
    messages,
    text,
    setText,
    onSend,
    onAttachment,
    query,
    setQuery,
    filter,
    setFilter,
    counts,
    chatSearch,
    setChatSearch,
    searchOpen,
    setSearchOpen,
    onEnableNotifications,
    onOpenMenu,
    onRequestClose,
    onChangeStatus,
    onInternalNote,
  } = props;

  const visibleMessages = chatSearch.trim()
    ? messages.filter((m) =>
        (m.content || m.text).toLowerCase().includes(chatSearch.trim().toLowerCase())
      )
    : messages;

  return (
    <div className="h-[100svh] w-full overflow-hidden bg-[var(--color-background)] text-[var(--color-text)] md:hidden">
      {/* ---------------------------- CHAT LIST ---------------------------- */}
      {mobileView === 'chats' && (
        <div className="flex h-full flex-col bg-[var(--color-surface)]">
          <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-3 pt-[calc(16px+env(safe-area-inset-top))] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenMenu}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)]"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-base font-black tracking-wide text-[var(--color-text)]">EPSA CRM</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">Atencion al cliente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onEnableNotifications}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm"
                aria-label="Activar notificaciones"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar conversaciones, clientes..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 pl-9 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {(
                [
                  ['all', 'Todas', counts.all],
                  ['pending', 'Pendientes', counts.pending],
                  ['attention', 'En atención', counts.attention],
                ] as Array<[ChatFilter, string, number]>
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    filter === value
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {label} {count}
                </button>
              ))}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                selected={active?.id === conversation.id}
                onSelect={onSelect}
              />
            ))}
            {filteredConversations.length === 0 && (
              <p className="p-10 text-center text-sm text-[var(--color-text-muted)]">
                No hay conversaciones con este filtro.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------- CHAT ------------------------------ */}
      {mobileView === 'chat' && active && (
        <div className="flex h-full flex-col bg-[var(--color-chat)]">
          <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-[calc(12px+env(safe-area-inset-top)/2)]">
            <button
              type="button"
              onClick={() => setMobileView('chats')}
              aria-label="Volver a conversaciones"
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] text-2xl leading-none text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setMobileView('tools')}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary)] ring-1 ring-[var(--color-primary-border)]">
                {initials(active.client?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                  {active.client?.name || 'Cliente sin nombre'}
                </p>
                <p className="text-xs text-online">En atención</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Buscar mensajes"
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
            >
              <Search className="h-5 w-5" />
            </button>
          </header>

          {searchOpen && (
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <input
                autoFocus
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Buscar en el chat"
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div
            className="flex-1 overflow-y-auto bg-[var(--color-chat)] px-3 py-4"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          >
            {visibleMessages.map((message) => (
              <div key={message.id} className="mb-3">
                <MessageBubble message={message} />
              </div>
            ))}
            {visibleMessages.length === 0 && (
              <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                No hay mensajes todavía.
              </p>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="flex items-end gap-2">
              <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
                <Paperclip className="h-5 w-5" />
                <input
                  className="hidden"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onAttachment(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                rows={1}
                placeholder="Escribe un mensaje"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
              />
              <button
                type="button"
                onClick={onSend}
                aria-label="Enviar mensaje"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------ TOOLS ----------------------------- */}
      {mobileView === 'tools' && active && (
        <div className="flex h-full flex-col bg-[var(--color-surface)]">
          <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileView('chat')}
              className="text-sm font-semibold text-[var(--color-primary)]"
            >
              Volver
            </button>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">Información y acciones</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-lg font-semibold text-[var(--color-text)]">
              {active.client?.name || 'Cliente sin nombre'}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {active.client?.whatsapp_number || 'Sin teléfono registrado'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={onRequestClose}
                className="rounded-[var(--radius-button)] border border-primary-border bg-[var(--color-primary-soft)] p-3 text-sm font-semibold text-[var(--color-primary)]"
              >
                Solicitar cierre
              </button>
              <button
                onClick={() => onChangeStatus('transferred')}
                className="rounded-[var(--radius-button)] border border-pending bg-[color:var(--color-warning)]/10 p-3 text-sm font-semibold text-[var(--color-warning)]"
              >
                Transferir
              </button>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Nota interna
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe una nota para el equipo"
                className="mt-2 min-h-28 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => {
                  if (!text.trim()) return;
                  onInternalNote(text);
                  setText('');
                }}
                className="mt-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
