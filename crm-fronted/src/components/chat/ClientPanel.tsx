import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Ticket, X } from 'lucide-react';
import type { Conversation } from '../../lib/constants';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Props {
  conversation: Conversation;
  onClose: () => void;
  onRequestClose: () => void;
  onAssign: (userId: number | null) => void;
}

export const ClientPanel: React.FC<Props> = ({
  conversation,
  onClose,
  onRequestClose,
  onAssign,
}) => {
  const { enabled } = useAuth();
  const [team, setTeam] = useState<Array<{ id: number; name: string }>>([]);
  useEffect(() => {
    if (enabled) void api.getTeam().then(setTeam).catch(() => setTeam([]));
  }, [enabled]);
  const initials = (conversation.client?.name || 'C')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const closureState = conversation.context?.closure_state;
  const isClosed = ['finished', 'closed'].includes(conversation.status);

  return (
    <aside className="min-h-0 overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-black text-[var(--color-primary)] ring-1 ring-[var(--color-primary-border)]">
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {conversation.client?.name || 'Cliente sin nombre'}
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">WhatsApp</p>
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            <a href={conversation.client?.whatsapp_number ? `https://wa.me/${conversation.client.whatsapp_number.replace(/\D/g, '')}` : undefined} target="_blank" rel="noreferrer" aria-disabled={!conversation.client?.whatsapp_number} className="flex flex-col items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-3 text-xs font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-40"><MessageCircle className="h-4 w-4" />WhatsApp</a>
              <a href={conversation.client?.whatsapp_number ? `tel:+${conversation.client.whatsapp_number.replace(/\D/g, '')}` : undefined} aria-disabled={!conversation.client?.whatsapp_number} className="flex flex-col items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-3 text-xs font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] aria-disabled:pointer-events-none aria-disabled:opacity-40"><Phone className="h-4 w-4" />Llamar</a>
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
            <Link to="/admin/tickets" className="text-sm font-semibold text-[var(--color-primary)]">{conversation.open_tickets_count || 0} abiertos · Ver tickets</Link>
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
            {enabled ? <select aria-label="Responsable de la conversación" value={conversation.assigned_to ?? ''} onChange={(event) => onAssign(event.target.value ? Number(event.target.value) : null)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)]"><option value="">Sin asignar</option>{team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select> : <p className="text-sm text-[var(--color-text-muted)]">Sin asignar</p>}
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
