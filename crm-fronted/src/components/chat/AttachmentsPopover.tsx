// src/components/chat/AttachmentsPopover.tsx
import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Megaphone,
  QrCode,
  ReceiptText,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  templates,
  type Conversation,
  type initialInvoice as InitialInvoiceType,
} from '../../lib/constants';
import { InvoiceEditor } from './InvoiceEditor';

type Action = 'menu' | 'broadcast' | 'invoice' | 'quick' | 'photo' | 'qr';

interface Props {
  action: Action;
  setAction: (a: Action) => void;
  onClose: () => void;
  active: Conversation | null;
  invoice: typeof InitialInvoiceType;
  setInvoice: React.Dispatch<React.SetStateAction<typeof InitialInvoiceType>>;
  onSendInvoice: () => void;
  onNotice?: (msg: string) => void;
}

export const AttachmentsPopover: React.FC<Props> = ({
  action,
  setAction,
  onClose,
  active,
  invoice,
  setInvoice,
  onSendInvoice,
  onNotice,
}) => {
  return (
    <div className="absolute bottom-[58px] left-0 z-30 w-[340px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
      {action === 'menu' && <MenuView setAction={setAction} />}
      {action === 'quick' && <QuickRepliesView setAction={setAction} onClose={onClose} onNotice={onNotice} />}
      {action === 'broadcast' && <BroadcastView setAction={setAction} onClose={onClose} onNotice={onNotice} />}
      {action === 'qr' && <QrView setAction={setAction} onClose={onClose} active={active} onNotice={onNotice} />}
      {action === 'photo' && <PhotoView setAction={setAction} onClose={onClose} active={active} onNotice={onNotice} />}
      {action === 'invoice' && (
        <InvoiceView
          setAction={setAction}
          onClose={onClose}
          invoice={invoice}
          setInvoice={setInvoice}
          active={active}
          onSendInvoice={onSendInvoice}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------- */
/* Sub-vistas                                                           */
/* -------------------------------------------------------------------- */

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="text-xs text-[var(--color-primary)]">
    Atrás
  </button>
);

const Header: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="mb-2 flex items-center justify-between">
    <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
    <BackButton onClick={onBack} />
  </div>
);

const MenuView: React.FC<{ setAction: (a: Action) => void }> = ({ setAction }) => {
  const items: Array<{ key: Action; label: string; Icon: React.ElementType; tone: 'sky' | 'slate' }> = [
    { key: 'broadcast', label: 'Enviar anuncio', Icon: Megaphone, tone: 'sky' },
    { key: 'qr', label: 'Enviar QR', Icon: QrCode, tone: 'slate' },
    { key: 'photo', label: 'Enviar foto', Icon: ImageIcon, tone: 'slate' },
    { key: 'invoice', label: 'Enviar factura', Icon: ReceiptText, tone: 'slate' },
    { key: 'quick', label: 'Respuestas rápidas', Icon: Zap, tone: 'slate' },
  ];

  return (
    <div className="space-y-2">
      {items.map(({ key, label, Icon, tone }) => (
        <button
          key={key}
          type="button"
          onClick={() => setAction(key)}
          className={`flex w-full items-center justify-between rounded-[var(--radius-button)] px-3 py-2 text-left text-sm font-medium ${
            tone === 'sky'
              ? 'bg-[var(--color-primary-soft)] text-sky-800 hover:bg-primary-soft'
              : 'bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
          }`}
        >
          <span>{label}</span>
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
};

/* -------------------------- Quick replies --------------------------- */

const QuickRepliesView: React.FC<{
  setAction: (a: Action) => void;
  onClose: () => void;
  onNotice?: (msg: string) => void;
}> = ({ setAction, onClose, onNotice }) => (
  <div className="space-y-3">
    <Header title="Respuestas rápidas" onBack={() => setAction('menu')} />
    <button
      type="button"
      onClick={() => {
        onClose();
        onNotice?.('IA activada para esta conversación.');
      }}
      className="w-full rounded-[var(--radius-button)] border border-online bg-[var(--color-success)]/10 px-3 py-2 text-left text-sm font-medium text-[var(--color-success)]"
    >
      Activar IA
    </button>
    <button
      type="button"
      onClick={() => {
        onClose();
        onNotice?.('La conversación quedó en modo operador.');
      }}
      className="w-full rounded-[var(--radius-button)] border border-pending bg-[color:var(--color-warning)]/10 px-3 py-2 text-left text-sm font-medium text-[var(--color-warning)]"
    >
      Desactivar IA
    </button>
    {templates.map((t) => (
      <button
        key={t.name}
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(t.text);
          onClose();
          onNotice?.(`Plantilla "${t.name}" copiada al portapapeles.`);
        }}
        className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-left text-sm text-[var(--color-text)]"
      >
        <span className="block font-semibold">{t.name}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)]">{t.text}</span>
      </button>
    ))}
  </div>
);

/* --------------------------- Broadcast ------------------------------ */

const BroadcastView: React.FC<{
  setAction: (a: Action) => void;
  onClose: () => void;
  onNotice?: (msg: string) => void;
}> = ({ setAction, onClose, onNotice }) => {
  const [text, setText] = useState(templates[0].text);
  const [recipients, setRecipients] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    const list = recipients
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0 || !text.trim()) return;
    setSending(true);
    try {
      const response = await api.sendBroadcast({ recipients: list, text, image });
      if (!response?.success) throw new Error(response?.error || 'WhatsApp no confirmó el aviso.');
      onNotice?.(`Aviso enviado a ${list.length} destino(s).`);
      onClose();
    } catch (e: any) {
      onNotice?.(e?.response?.data?.error || e?.message || 'No se pudo enviar el aviso.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Header title="Enviar anuncio" onBack={() => setAction('menu')} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-sky-500"
        placeholder="Escribe el anuncio..."
      />
      <textarea
        value={recipients}
        onChange={(e) => setRecipients(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-sky-500"
        placeholder="Número(s), uno por línea o separado por comas"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        className="block w-full text-xs text-[var(--color-text-muted)]"
      />
      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {sending ? 'Enviando...' : 'Enviar anuncio'}
      </button>
    </div>
  );
};

/* ------------------------------- QR --------------------------------- */

const QrView: React.FC<{
  setAction: (a: Action) => void;
  onClose: () => void;
  active: Conversation | null;
  onNotice?: (msg: string) => void;
}> = ({ setAction, onClose, active, onNotice }) => {
  const [qr, setQr] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!active || !qr) return;
    setSending(true);
    try {
      await api.sendQr(active.id, active.client?.whatsapp_number || '', qr);
      onNotice?.('QR enviado al cliente.');
      onClose();
    } catch (e: any) {
      onNotice?.(e?.response?.data?.error || e?.message || 'No se pudo enviar el QR.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Header title="Enviar QR" onBack={() => setAction('menu')} />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setQr(e.target.files?.[0] ?? null)}
        className="block w-full text-xs text-[var(--color-text-muted)]"
      />
      <button
        type="button"
        onClick={send}
        disabled={!qr || sending}
        className="w-full rounded-[var(--radius-button)] bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {sending ? 'Enviando...' : 'Enviar QR'}
      </button>
    </div>
  );
};

/* ------------------------------ Photo ------------------------------- */

const PhotoView: React.FC<{
  setAction: (a: Action) => void;
  onClose: () => void;
  active: Conversation | null;
  onNotice?: (msg: string) => void;
}> = ({ setAction, onClose, active, onNotice }) => {
  const [sending, setSending] = useState(false);

  const handle = async (file?: File) => {
    if (!active || !file) return;
    setSending(true);
    try {
      await api.sendAttachment(active.id, active.client?.whatsapp_number || '', file);
      onNotice?.('Archivo enviado correctamente.');
      onClose();
    } catch (e: any) {
      onNotice?.(e?.response?.data?.error || e?.message || 'No se pudo enviar el archivo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Header title="Enviar foto" onBack={() => setAction('menu')} />
      <input
        type="file"
        accept="image/*"
        disabled={sending}
        onChange={(e) => handle(e.target.files?.[0])}
        className="block w-full text-xs text-[var(--color-text-muted)]"
      />
      {sending && <p className="text-xs text-[var(--color-text-muted)]">Enviando...</p>}
    </div>
  );
};

/* ----------------------------- Invoice ------------------------------ */

const InvoiceView: React.FC<{
  setAction: (a: Action) => void;
  onClose: () => void;
  invoice: typeof InitialInvoiceType;
  setInvoice: React.Dispatch<React.SetStateAction<typeof InitialInvoiceType>>;
  active: Conversation | null;
  onSendInvoice: () => void;
}> = ({ setAction, onClose, invoice, setInvoice, active, onSendInvoice }) => (
  <div className="space-y-3">
    <Header title="Factura" onBack={() => setAction('menu')} />
    <InvoiceEditor
      invoice={invoice}
      setInvoice={setInvoice}
      active={active}
      onSend={() => {
        onSendInvoice();
        onClose();
      }}
    />
  </div>
);