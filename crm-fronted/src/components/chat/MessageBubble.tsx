import React, { useEffect, useState } from 'react';
import type { Message } from '../../lib/constants';
import { api } from '../../services/api';

interface Props {
  message: Message;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const [mediaUrl, setMediaUrl] = useState('');
  useEffect(() => {
    const mediaId = message.metadata?.media_id;
    if (!mediaId) {
      setMediaUrl(message.metadata?.media_url || '');
      return;
    }
    let active = true;
    let objectUrl = '';
    void api.getMedia(mediaId).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setMediaUrl(objectUrl);
    }).catch(() => setMediaUrl(''));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [message.metadata?.media_id, message.metadata?.media_url]);

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
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content || message.text}
        </p>
        {mediaUrl && (message.metadata?.media_type === 'image' || message.metadata?.kind === 'payment_proof') && (
          <a href={mediaUrl} target="_blank" rel="noreferrer" title="Abrir imagen"><img src={mediaUrl} alt={message.metadata?.filename || 'Imagen adjunta'} className="mt-2 max-h-72 max-w-full rounded-lg object-contain" /></a>
        )}
        {mediaUrl && message.metadata?.media_type === 'document' && (
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold underline">Abrir {message.metadata?.filename || 'documento'}</a>
        )}
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
