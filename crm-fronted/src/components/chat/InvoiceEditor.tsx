import React from 'react';
import {
  initialInvoice,
  invoiceLabels,
  type Conversation,
} from '../../lib/constants';

interface Props {
  invoice: typeof initialInvoice;
  setInvoice: React.Dispatch<React.SetStateAction<typeof initialInvoice>>;
  active: Conversation | null;
  onSend: () => void;
}

export const InvoiceEditor: React.FC<Props> = ({ invoice, setInvoice, active, onSend }) => (
  <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f7f8fa] p-3">
    <div className="rounded-[14px] border-[2px] border-[#1f1f1f] bg-[var(--color-surface)] p-4 text-[#1e1a16] shadow-sm"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-black uppercase tracking-tight">EPSA "EL PORTILLO"</div>
          <div className="mt-1 text-[9px] italic text-[var(--color-text)]">Entidad Prestadora de</div>
          <div className="text-[9px] italic text-[var(--color-text)]">Servicio de Agua Potable y Saneamiento</div>
        </div>
        <div className="text-right">
          <div className="text-[12px] font-black uppercase tracking-wide">RECIBO DE COBRO</div>
          <div className="text-[12px] font-black uppercase tracking-wide">DE SERVICIO DE AGUA POTABLE</div>
          <div className="mt-1 text-[16px] font-black tracking-[0.08em]">
            N° <span className="inline-block min-w-[80px] border-b border-dashed border-[#222] px-1 text-center">{invoice.bill_number || '007504'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-[#111] pb-1 text-[11px] font-black uppercase">
          <span>NOMBRE DEL USUARIO:</span>
          <span className="flex-1 border-b border-dashed border-[#111] px-1 font-normal normal-case">
            {invoice.user_name || active?.client?.name || '........................................'}
          </span>
        </div>
        <div className="text-[11px] font-black uppercase">LECTURACIÓN:</div>
        <div className="grid grid-cols-3 border-[1.5px] border-[#111] text-center text-[11px] font-black uppercase">
          <div className="border-r border-[#111] px-2 py-2">LECT. ANT. M³</div>
          <div className="border-r border-[#111] px-2 py-2">LECT. ACTUAL. M³</div>
          <div className="px-2 py-2">CONSUMO M³</div>
        </div>
        <div className="grid grid-cols-3 border-[1.5px] border-[#111] border-t-0 text-center text-[10px]">
          <div className="border-r border-[#111] px-2 py-3">{invoice.previous_reading}</div>
          <div className="border-r border-[#111] px-2 py-3">{invoice.current_reading}</div>
          <div className="px-2 py-3">{invoice.consumption}</div>
        </div>
      </div>

      <div className="mt-5 text-[11px] font-black uppercase">CONSUMO EN BOLIVIANOS:</div>
      <div className="mt-2 grid grid-cols-5 border-[1.5px] border-[#111] text-center text-[11px] font-black uppercase">
        <div className="border-r border-[#111] px-2 py-2">Tarifa básica 10 m³</div>
        <div className="border-r border-[#111] px-2 py-2">11 a 15 m³</div>
        <div className="border-r border-[#111] px-2 py-2">16 a 20 m³</div>
        <div className="border-r border-[#111] px-2 py-2">20 a 30 m³</div>
        <div className="px-2 py-2">Total Bs.</div>
      </div>
      <div className="grid grid-cols-5 border-[1.5px] border-[#111] border-t-0 text-center text-[10px]">
        <div className="border-r border-[#111] px-2 py-3">{invoice.basic_rate}</div>
        <div className="border-r border-[#111] px-2 py-3">{invoice.tier_11_15}</div>
        <div className="border-r border-[#111] px-2 py-3">{invoice.tier_16_20}</div>
        <div className="border-r border-[#111] px-2 py-3">{invoice.tier_20_30}</div>
        <div className="px-2 py-3">{invoice.amount}</div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] font-black uppercase">
        <span>Son:</span>
        <span className="flex-1 border-b border-dashed border-[#111] px-1 text-right font-normal normal-case">
          {invoice.amount_literal || '00/100 Bolivianos'}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between text-[11px] font-black uppercase">
        <span>EL PORTILLO,</span>
        <span className="flex-1 border-b border-dashed border-[#111] px-2 text-center">DE</span>
        <span className="flex-1 border-b border-dashed border-[#111] px-2 text-center">
          DE 202{invoice.year?.slice(-1) || '6'}
        </span>
      </div>

      <div className="mt-5 text-[11px] font-black uppercase tracking-wider">ENTREGUÉ CONFORME</div>
      <div className="mt-2 border-b border-[#111]" />

      <div className="mt-4 text-[11px] font-black uppercase">
        NOTA: ¡Estimado usuario evite el corte de servicio por tres meses en mora el servicio será cortado.
      </div>
      <div className="mt-1 text-center text-[12px] font-semibold italic">
        "El agua es vida, cuídala"
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--color-text)]">
      {Object.entries(invoiceLabels).map(([key, label]) => (
        <label key={key} className="space-y-1">
          <span>{label}</span>
          <input
            value={invoice[key as keyof typeof invoice]}
            onChange={(e) =>
              setInvoice((cur) => ({ ...cur, [key]: e.target.value }))
            }
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs outline-none focus:border-sky-500"
          />
        </label>
      ))}
    </div>

    <button
      type="button"
      onClick={onSend}
      className="w-full rounded-[var(--radius-button)] bg-[#1f72f3] px-3 py-2 text-sm font-semibold text-white"
    >
      Enviar PDF
    </button>
  </div>
);