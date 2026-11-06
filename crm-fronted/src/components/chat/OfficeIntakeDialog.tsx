import React, { useEffect, useState } from 'react';
import { ClipboardList, X } from 'lucide-react';
import { api } from '../../services/api';
import type { Conversation } from '../../lib/constants';

interface ExistingClient {
  id: number;
  name: string | null;
  phone: string | null;
  whatsapp_number: string | null;
}

interface Props {
  onClose: () => void;
  onCreated: (conversation: Conversation, ticketNumber: string) => void;
}

const inputClass = 'mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]';

export const OfficeIntakeDialog: React.FC<Props> = ({ onClose, onCreated }) => {
  const [source, setSource] = useState<'office' | 'paper'>('office');
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [matches, setMatches] = useState<ExistingClient[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('consulta');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [receivedAt, setReceivedAt] = useState('');
  const [paperReference, setPaperReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clientId || clientSearch.trim().length < 2) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const page = await api.getAdminResource('clients', { search: clientSearch.trim(), per_page: 8 });
        if (!cancelled) setMatches(Array.isArray(page?.data) ? page.data : []);
      } catch {
        if (!cancelled) setMatches([]);
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [clientId, clientSearch]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await api.createOfficeIntake({
        ...(clientId ? { client_id: clientId } : { name: name.trim(), phone: phone.trim() || undefined }),
        source,
        ...(source === 'paper' ? { received_at: new Date(receivedAt).toISOString(), paper_reference: paperReference.trim() } : {}),
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      });
      onCreated(result.conversation, result.ticket.ticket_number);
    } catch (failure: any) {
      setError(failure?.response?.data?.message || failure?.response?.data?.error || 'No se pudo registrar la atención.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="office-intake-title" className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-[var(--color-primary)]" /><h2 id="office-intake-title" className="text-base font-semibold">Registrar atención</h2></div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-2 hover:bg-[var(--color-background)]"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={save} className="min-h-0 space-y-4 overflow-y-auto p-5">
          <fieldset className="flex gap-4 text-sm"><legend className="mb-2 font-semibold">Origen</legend>
            <label className="flex items-center gap-2"><input type="radio" checked={source === 'office'} onChange={() => setSource('office')} />Atención en oficina</label>
            <label className="flex items-center gap-2"><input type="radio" checked={source === 'paper'} onChange={() => setSource('paper')} />Formulario escrito</label>
          </fieldset>
          {source === 'paper' && <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Fecha y hora de recepción<input required type="datetime-local" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} className={inputClass} /></label>
            <label className="text-sm font-medium">Referencia del formulario<input required maxLength={120} value={paperReference} onChange={(event) => setPaperReference(event.target.value)} className={inputClass} /></label>
          </div>}
          <div>
            <label className="text-sm font-medium">Buscar socio existente<input value={clientSearch} onChange={(event) => { setClientSearch(event.target.value); setClientId(null); }} placeholder="Nombre o teléfono" className={inputClass} /></label>
            {matches.length > 0 && <div className="mt-1 max-h-36 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-background)]">{matches.map((client) => <button key={client.id} type="button" onClick={() => { setClientId(client.id); setClientSearch(client.name || `Socio #${client.id}`); setMatches([]); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-primary-soft)]">{client.name || `Socio #${client.id}`} · {client.phone || client.whatsapp_number || 'Sin teléfono'}</button>)}</div>}
            {clientId && <button type="button" onClick={() => { setClientId(null); setClientSearch(''); }} className="mt-1 text-xs text-[var(--color-primary)]">Cambiar socio</button>}
          </div>
          {!clientId && <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Nombre del socio<input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
            <label className="text-sm font-medium">Teléfono (opcional)<input maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} /></label>
          </div>}
          <label className="block text-sm font-medium">Asunto<input required maxLength={255} value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClass} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Tipo<select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option value="consulta">Consulta</option><option value="servicio">Solicitud de servicio</option><option value="fuga_casa">Reporte de fuga</option><option value="facturacion">Facturación</option><option value="medidor">Medidor</option><option value="queja">Queja</option><option value="reclamo">Reclamo formal (verificar procedimiento)</option><option value="otro">Otro</option></select></label>
            <label className="text-sm font-medium">Prioridad<select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className={inputClass}><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
          </div>
          <label className="block text-sm font-medium">Relato recibido<textarea required rows={4} maxLength={4096} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></label>
          <p className="text-xs text-[var(--color-text-muted)]">Se creará un folio y un ticket. La clasificación inicial puede revisarse; registrar un reclamo aquí no sustituye el procedimiento formal que corresponda.</p>
          {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4"><button type="button" onClick={onClose} className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm">Cancelar</button><button disabled={saving} type="submit" className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Registrar'}</button></div>
        </form>
      </div>
    </div>
  );
};
