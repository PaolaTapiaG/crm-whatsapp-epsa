import React, { useMemo, useState } from 'react';
import { Check, Clock, Copy, CreditCard, Headphones, Info, Plus, Save, Search, Send, Trash2, Wand2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

const templates = [
  {
    id: 'TPL-001',
    name: 'Bienvenida inicial',
    shortcut: '/bienvenida',
    category: 'Bienvenida',
    status: 'Activa',
    icon: Wand2,
    message: '¡Hola {{nombre}}! Gracias por contactarnos. En EPSA estamos para ayudarte. ¿Cómo podemos apoyarte hoy?',
    updated: '12 mar. 2026',
  },
  {
    id: 'TPL-002',
    name: 'Seguimiento cotización',
    shortcut: '/seguimiento',
    category: 'Seguimiento',
    status: 'Activa',
    icon: Clock,
    message: 'Hola {{nombre}}, ¿te gustaría saber si tu solicitud ya tiene actualización?',
    updated: '10 mar. 2026',
  },
  {
    id: 'TPL-003',
    name: 'Recordatorio de pago',
    shortcut: '/cobro',
    category: 'Cobro',
    status: 'Activa',
    icon: CreditCard,
    message: 'Hola {{nombre}}, te recordamos que tienes un pago pendiente. Secretaría puede ayudarte a verificarlo.',
    updated: '8 mar. 2026',
  },
  {
    id: 'TPL-004',
    name: 'Soporte técnico',
    shortcut: '/soporte',
    category: 'Soporte',
    status: 'Activa',
    icon: Headphones,
    message: 'Hola {{nombre}}, estamos para ayudarte. Envíanos una referencia de ubicación y una foto si corresponde.',
    updated: '6 mar. 2026',
  },
  {
    id: 'TPL-005',
    name: 'Cierre de conversación',
    shortcut: '/cierre',
    category: 'Cierre',
    status: 'Activa',
    icon: Check,
    message: 'Gracias por confiar en nosotros. Cerraremos esta conversación; puedes escribirnos nuevamente si necesitas algo más.',
    updated: '4 mar. 2026',
  },
  {
    id: 'TPL-006',
    name: 'Horario de atención',
    shortcut: '/horario',
    category: 'Soporte',
    status: 'Inactiva',
    icon: Info,
    message: 'Nuestro horario de atención es de lunes a viernes de 08:00 a 18:00.',
    updated: '2 mar. 2026',
  },
];

const categories = ['Todas', 'Bienvenida', 'Seguimiento', 'Cobro', 'Soporte', 'Cierre'];
const variables = ['{{nombre}}', '{{empresa}}', '{{telefono}}', '{{fecha}}'];

const IntentManagementPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState('TPL-001');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');

  const filtered = useMemo(
    () =>
      templates.filter((template) => {
        const matchesCategory = category === 'Todas' || template.category === category;
        const haystack = `${template.name} ${template.shortcut} ${template.message}`.toLowerCase();
        return matchesCategory && haystack.includes(query.toLowerCase());
      }),
    [category, query]
  );

  const selected = templates.find((template) => template.id === selectedId) || templates[0];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <AdminSidebar />
      <main className="px-4 py-4 md:ml-[248px] md:px-6">
        <div className="mx-auto max-w-[1380px]">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Respuestas rápidas</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Plantillas, atajos, variables y pruebas para WhatsApp.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(22,199,102,0.24)]">
              <Plus className="h-4 w-4" />
              Nueva plantilla
            </button>
          </header>

          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                  category === item
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(340px,470px)_1fr]">
            <div>
              <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_150px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar plantillas..."
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <button className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm font-semibold">Más recientes</button>
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                {filtered.map((template) => {
                  const Icon = template.icon;
                  const active = template.id === selected.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedId(template.id)}
                      className={`flex w-full gap-3 border-b border-[var(--color-border)] p-4 text-left last:border-b-0 ${
                        active ? 'bg-[var(--color-primary-soft)] shadow-[inset_4px_0_0_var(--color-primary)]' : 'hover:bg-[var(--color-background)]'
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-background)] text-[var(--color-primary)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-bold">{template.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${template.status === 'Activa' ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'bg-[var(--color-muted)] text-[var(--color-text-muted)]'}`}>
                            {template.status}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-[var(--color-text-muted)]">{template.shortcut}</span>
                        <span className="mt-1 block truncate text-xs text-[var(--color-text-muted)]">{template.message}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Editar plantilla</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">ID: #{selected.id}</p>
                </div>
                <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{selected.status}</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Nombre de la plantilla" value={selected.name} />
                <Field label="Estado" value={selected.status} />
              </div>

              <Field className="mt-4" label="Atajo / comando" value={selected.shortcut} />

              <label className="mt-4 block">
                <span className="text-xs font-bold text-[var(--color-text)]">Mensaje</span>
                <textarea
                  defaultValue={selected.message}
                  rows={7}
                  className="mt-2 w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--color-primary)]"
                />
              </label>

              <div className="mt-4">
                <p className="text-xs font-bold">Variables disponibles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variables.map((variable) => (
                    <button key={variable} type="button" className="rounded-md bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--color-primary)]">
                      {variable}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-bold">Canal de uso</span>
                <select className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-sm outline-none">
                  <option>WhatsApp</option>
                  <option>Presencial</option>
                  <option>Teléfono</option>
                </select>
              </label>

              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-4">
                <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm font-bold text-danger">
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-bold">
                  <Copy className="h-4 w-4" />
                  Duplicar
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-2 text-sm font-bold text-[var(--color-primary)]">
                  <Send className="h-4 w-4" />
                  Enviar prueba
                </button>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-bold text-white">
                  <Save className="h-4 w-4" />
                  Guardar
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="text-xs font-bold text-[var(--color-text)]">{label}</span>
    <input
      defaultValue={value}
      className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
    />
  </label>
);

export default IntentManagementPage;
