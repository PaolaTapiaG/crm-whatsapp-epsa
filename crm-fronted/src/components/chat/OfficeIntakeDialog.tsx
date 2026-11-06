import React, { useEffect, useState } from 'react';
import { ClipboardList, X } from 'lucide-react';
import { api } from '../../services/api';
import type { Conversation } from '../../lib/constants';

type Source = 'office' | 'paper' | 'phone' | 'sms';
type CaseType = 'consulta' | 'solicitud' | 'reclamo' | 'emergencia';
type ContactMethod = 'office' | 'phone' | 'sms' | 'whatsapp';
interface ExistingClient { id: number; name: string | null; phone: string | null; whatsapp_number: string | null }
interface Props { onClose: () => void; onCreated: (conversation: Conversation, ticketNumber: string) => void }
const inputClass = 'mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]';
const sources: Array<[Source, string]> = [['office', 'Atención en oficina'], ['paper', 'Formulario físico'], ['phone', 'Llamada recibida'], ['sms', 'SMS recibido']];

export const OfficeIntakeDialog: React.FC<Props> = ({ onClose, onCreated }) => {
  const [source, setSource] = useState<Source>('office');
  const [caseType, setCaseType] = useState<CaseType>('consulta');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('office');
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [matches, setMatches] = useState<ExistingClient[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('consulta');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [receivedAt, setReceivedAt] = useState('');
  const [responseDueAt, setResponseDueAt] = useState('');
  const [paperReference, setPaperReference] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clientId || clientSearch.trim().length < 2) { setMatches([]); return; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const page = await api.getAdminResource('clients', { search: clientSearch.trim(), per_page: 8 });
        if (!cancelled) setMatches(Array.isArray(page?.data) ? page.data : []);
      } catch { if (!cancelled) setMatches([]); }
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
        ...(receivedAt ? { received_at: new Date(receivedAt).toISOString() } : {}),
        ...(source === 'paper' ? { paper_reference: paperReference.trim() } : {}),
        ...(sourceReference.trim() ? { source_reference: sourceReference.trim() } : {}),
        ...(claimNumber.trim() ? { claim_number: claimNumber.trim() } : {}),
        ...(serviceCode.trim() ? { service_code: serviceCode.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        case_type: caseType,
        ...(responseDueAt ? { response_due_at: new Date(responseDueAt).toISOString() } : {}),
        contact_method: contactMethod,
        subject: subject.trim(), description: description.trim(), category, priority,
      });
      onCreated(result.conversation, result.ticket.ticket_number);
    } catch (failure: any) {
      const errors = failure?.response?.data?.errors;
      const firstError = errors && Object.values(errors).flat()[0];
      setError(String(firstError || failure?.response?.data?.message || failure?.response?.data?.error || 'No se pudo registrar la atención.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="office-intake-title" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-[var(--color-primary)]" /><h2 id="office-intake-title" className="text-base font-semibold">Registrar atención</h2></div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-2 hover:bg-[var(--color-background)]"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={save} className="min-h-0 space-y-4 overflow-y-auto p-5">
          <fieldset className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><legend className="mb-2 font-semibold">Canal de origen</legend>
            {sources.map(([value, label]) => <label key={value} className={`flex items-center gap-2 rounded-md border px-3 py-2 ${source === value ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)]'}`}><input type="radio" name="source" checked={source === value} onChange={() => { setSource(value); setContactMethod(value === 'paper' ? 'office' : value); }} />{label}</label>)}
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Fecha y hora de recepción<input required={source === 'paper'} type="datetime-local" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} className={inputClass} /><span className="text-xs font-normal text-[var(--color-text-muted)]">Si se deja vacío, se registra la hora actual.</span></label>
            {source === 'paper' ? <label className="text-sm font-medium">Referencia del formulario<input required maxLength={120} value={paperReference} onChange={(event) => setPaperReference(event.target.value)} className={inputClass} /></label>
              : (source === 'phone' || source === 'sms') ? <label className="text-sm font-medium">Referencia del {source === 'phone' ? 'registro de llamada' : 'SMS'} (opcional)<input maxLength={120} value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} className={inputClass} /></label> : null}
          </div>
          <div>
            <label className="text-sm font-medium">Buscar socio existente<input value={clientSearch} onChange={(event) => { setClientSearch(event.target.value); setClientId(null); }} placeholder="Nombre o teléfono" className={inputClass} /></label>
            {matches.length > 0 && <div className="mt-1 max-h-36 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-background)]">{matches.map((client) => <button key={client.id} type="button" onClick={() => { setClientId(client.id); setClientSearch(client.name || `Socio #${client.id}`); setMatches([]); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-primary-soft)]">{client.name || `Socio #${client.id}`} · {client.phone || client.whatsapp_number || 'Sin teléfono'}</button>)}</div>}
            {clientId && <button type="button" onClick={() => { setClientId(null); setClientSearch(''); }} className="mt-1 text-xs text-[var(--color-primary)]">Cambiar socio</button>}
          </div>
          {!clientId && <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Nombre del socio<input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
            <label className="text-sm font-medium">Teléfono {source === 'phone' || source === 'sms' ? '(obligatorio)' : '(opcional)'}<input required={source === 'phone' || source === 'sms'} maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} /></label>
          </div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Código de socio o cuenta (si se conoce)<input maxLength={80} value={serviceCode} onChange={(event) => setServiceCode(event.target.value)} className={inputClass} /></label>
            <label className="text-sm font-medium">Dirección del servicio (si se conoce)<input maxLength={500} value={address} onChange={(event) => setAddress(event.target.value)} className={inputClass} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Clase de atención<select value={caseType} onChange={(event) => { const value = event.target.value as CaseType; setCaseType(value); if (value === 'emergencia') { setPriority('urgent'); if (category === 'consulta') setCategory('servicio'); } }} className={inputClass}><option value="consulta">Consulta</option><option value="solicitud">Solicitud</option><option value="reclamo">Reclamo directo</option><option value="emergencia">Reclamo de emergencia</option></select></label>
            <label className="text-sm font-medium">Tema<select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option value="consulta">Información general</option><option value="servicio">Servicio</option><option value="fuga_casa">Fuga</option><option value="rotura_caneria">Rotura de cañería</option><option value="falta_agua">Falta de agua</option><option value="facturacion">Facturación</option><option value="medidor">Medidor</option><option value="queja">Queja</option><option value="reclamo">Reclamo</option><option value="otro">Otro</option></select></label>
          </div>
          {(caseType === 'reclamo' || caseType === 'emergencia') && <label className="block text-sm font-medium">N.º de reclamo ODECO (si ya fue asignado)<input maxLength={120} value={claimNumber} onChange={(event) => setClaimNumber(event.target.value)} className={inputClass} /><span className="text-xs font-normal text-[var(--color-text-muted)]">El folio interno del CRM no sustituye el correlativo oficial.</span></label>}
          <label className="block text-sm font-medium">Asunto<input required maxLength={255} value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium">Relato recibido<textarea required rows={4} maxLength={4096} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Prioridad<select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className={inputClass}><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
            <label className="text-sm font-medium">Comunicar respuesta por<select value={contactMethod} onChange={(event) => setContactMethod(event.target.value as ContactMethod)} className={inputClass}><option value="office">Oficina</option><option value="phone">Llamada</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></label>
          </div>
          {(caseType === 'reclamo' || caseType === 'emergencia') && <label className="block text-sm font-medium">Fecha tentativa de respuesta<input required type="datetime-local" value={responseDueAt} onChange={(event) => setResponseDueAt(event.target.value)} className={inputClass} /><span className="text-xs font-normal text-[var(--color-text-muted)]">La secretaría debe verificar el plazo aplicable y comunicarlo al usuario.</span></label>}
          {caseType === 'emergencia' && <p className="rounded-md border border-[var(--color-warning)] bg-[var(--color-warning)]/10 p-3 text-xs text-[var(--color-text)]">Deriva el reporte de inmediato al área responsable y comunica el número de registro. Guardar el ticket no equivale a despachar una cuadrilla.</p>}
          <p className="text-xs text-[var(--color-text-muted)]">Se asignará un folio y un ticket. Las llamadas y SMS se registran manualmente; este formulario no envía SMS ni realiza llamadas. Si corresponde el procedimiento ODECO, entrega o comunica la constancia y conserva el formulario físico según el proceso aprobado.</p>
          {error && <p role="alert" className="text-sm text-[var(--color-danger)]">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4"><button type="button" onClick={onClose} className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm">Cancelar</button><button disabled={saving} type="submit" className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Registrar'}</button></div>
        </form>
      </div>
    </div>
  );
};
