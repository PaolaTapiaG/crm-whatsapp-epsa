import React from 'react';
import type { Message } from '../../lib/constants';

interface Props {
  message: Message;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isInternal = Boolean(message.internal);
  const outbound = !isInternal && ['human', 'bot'].includes(message.sender);

  const role = isInternal
    ? 'Nota interna'
    : message.sender === 'bot'
    ? 'Asistente EPSA'
    : outbound
    ? 'Operador'
    : 'Cliente';

  const bubbleClass = isInternal
    ? 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-100'
    : outbound
    ? 'bg-[var(--color-primary)] text-white'
    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]';

  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${outbound ? 'rounded-br-sm' : 'rounded-bl-sm'} ${bubbleClass}`}>
        <div className={`mb-1 text-[10px] font-bold uppercase ${outbound ? 'text-white/80' : 'text-[var(--color-primary)]'}`}>
          {role}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content || message.text}
        </p>
        <div className={`mt-2 text-right text-[10px] ${outbound ? 'text-white/75' : 'text-[var(--color-text-muted)]'}`}>
          {new Date(message.created_at).toLocaleString('es-BO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
