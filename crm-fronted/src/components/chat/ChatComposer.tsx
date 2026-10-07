import React, { useRef } from 'react';
import { FileText, Mic, Paperclip, Plus, Send } from 'lucide-react';

interface Props {
  text: string;
  setText: (v: string) => void;
  onSend: () => void;
  onAttachment: (file: File) => void;
  onToggleAttachments: () => void;
  onOpenInvoice: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recording: boolean;
}

export const ChatComposer: React.FC<Props> = ({
  text,
  setText,
  onSend,
  onAttachment,
  onToggleAttachments,
  onOpenInvoice,
  onStartRecording,
  onStopRecording,
  recording,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-1 rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
          title="Adjuntar foto o documento"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggleAttachments} title="Más opciones" className="mb-1 rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]">
          <Plus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onOpenInvoice}
          title="Editar factura"
          className="mb-1 rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
        >
          <FileText className="h-4 w-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAttachment(f);
            e.target.value = '';
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-xl border-0 bg-transparent px-2 py-3 text-sm leading-5 text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
        />

        <button
          type="button"
          onClick={recording ? onStopRecording : onStartRecording}
          title={recording ? 'Detener audio' : 'Grabar audio'}
          className={`mb-1 rounded-full p-2 ${
            recording
              ? 'bg-danger-soft text-danger'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]'
          }`}
        >
          <Mic className="h-4 w-4" />
        </button>

        <button
          onClick={onSend}
          title="Enviar"
          className="mb-1 rounded-full bg-[var(--color-primary)] p-3 text-white shadow-[0_10px_24px_rgba(22,199,102,0.26)]"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
