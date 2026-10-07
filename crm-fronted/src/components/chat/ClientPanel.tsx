import React from 'react';
import { Bot, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Ticket, UserPlus, X } from 'lucide-react';
import type { Conversation } from '../../lib/constants';

interface Props {
  conversation: Conversation;
  onClose: () => void;
  onRequestClose: () => void;
}

export const ClientPanel: React.FC<Props> = ({
  conversation,
  onClose,
  onRequestClose,
}) => {
  const initials = (conversation.client?.name || 'C')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const closureState = conversation.context?.closure_state;
  const isClosed = ['finished', 'closed'].includes(conversation.status);

  return (
    <aside className="border-l border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)] ring-1 ring-[var(--color-primary-border)]">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {conversation.client?.name || 'Cliente sin nombre'}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-online">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-success)]/100" /> En línea
              </p>
            </div>
          </div>
          <button
            className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
            aria-label="Cerrar panel"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2">
            <QuickAction icon={MessageCircle} label="WhatsApp" />
            <QuickAction icon={Phone} label="Llamar" />
            <QuickAction icon={UserPlus} label="Asignar" />
          </div>

          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Datos del cliente</h3>
            <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <Row icon={ShieldCheck} label="Estado" value={conversation.client?.verified || conversation.client?.segment || 'Por verificar'} />
              <Row icon={Phone} label="Teléfono" value={conversation.client?.whatsapp_number || 'Sin teléfono'} />
              <Row icon={Mail} label="Correo" value={conversation.client?.email || 'Sin correo'} />
              <Row icon={MapPin} label="Ubicación" value={conversation.client?.address || 'Sin dirección registrada'} />
              <Row
                icon={MessageCircle}
                label="Último mensaje"
                value={
                  conversation.last_message?.text
                    ? String(conversation.last_message.text).slice(0, 28) +
                      (String(conversation.last_message.text).length > 28 ? '…' : '')
                    : 'Sin mensajes'
                }
              />
            </div>
          </div>

          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Modo de atención</h3>
              <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-1 text-[11px] font-medium text-[var(--color-primary)]">
                {conversation.ai_mode || 'AI_ASSIST'}
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
              <Bot className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
              <span>
              {conversation.status === 'active'
                ? 'La IA puede asistir y el operador conserva el control.'
                : conversation.status === 'transferred'
                ? 'Transferida a cola humana.'
                : conversation.status === 'finished'
                ? 'Finalizado'
                : 'Cerrado'}
              </span>
            </div>
          </div>

          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <Ticket className="h-4 w-4 text-[var(--color-primary)]" />
              Tickets abiertos
            </h3>
            <div className="rounded-lg bg-[var(--color-background)] p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[var(--color-text)]">Fuga de agua</span>
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-bold text-danger">P1</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Zona: {conversation.client?.zone || 'Sin zona'} · SLA 2 h</p>
            </div>
          </div>

          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Cierre de atención</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {closureState === 'awaiting_confirmation'
                    ? 'Esperando confirmación del cliente.'
                    : closureState === 'closed'
                    ? 'Cerrada por el cliente.'
                    : 'Solicita confirmación antes de cerrar.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestClose}
                disabled={closureState === 'awaiting_confirmation' || isClosed}
                className="rounded-lg border border-primary-border bg-[var(--color-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closureState === 'awaiting_confirmation' ? 'En espera' : 'Solicitar cierre'}
              </button>
            </div>
          </div>

          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Asignado a</h3>
            <div className="flex items-center gap-3 rounded-lg bg-[var(--color-background)] px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfeeff] text-[10px] font-semibold text-[var(--color-primary)]">
                CR
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Camila R.</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Operador</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Row: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="grid grid-cols-[18px_90px_1fr] items-start gap-2">
    <Icon className="mt-0.5 h-4 w-4 text-[var(--color-text-muted)]" />
    <span>{label}</span>
    <span className="text-right font-medium text-[var(--color-text)]">{value}</span>
  </div>
);

const QuickAction: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <button className="flex flex-col items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-3 text-xs font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]">
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);
