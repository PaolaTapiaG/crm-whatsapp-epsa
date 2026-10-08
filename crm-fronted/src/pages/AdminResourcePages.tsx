import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Filter, Import, MoreHorizontal, Plus, Search, Users } from 'lucide-react';
import { api } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import { initials } from '../lib/format';

type Resource = 'clients' | 'conversations' | 'tickets';

const AdminResourcePages: React.FC<{ resource: Resource }> = ({ resource }) => {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setData([]);
    setLoadError(false);
    setLoading(true);
    api
      .getAdminResource(resource, { per_page: 50 })
      .then((result) => {
        const next = Array.isArray(result) ? result : result?.data;
        if (mounted) setData(Array.isArray(next) ? next : []);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [resource]);

  const title = resource === 'clients' ? 'Contactos' : resource === 'conversations' ? 'Embudos' : 'Tickets';
  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const haystack = JSON.stringify(item).toLowerCase();
        const status = String(item.status || 'all').toLowerCase();
        return haystack.includes(search.toLowerCase()) && (filter === 'all' || status === filter);
      }),
    [data, filter, search]
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const stats = [
    ['Contactos cargados', data.length],
    ['Nuevos este mes', data.filter((item) => typeof item.created_at === 'string' && item.created_at.slice(0, 7) === currentMonth).length],
    ['Activos', data.filter((item) => ['active', 'activo'].includes(String(item.status || '').toLowerCase())).length],
    ['Sin respuesta', data.filter((item) => ['unresponsive', 'sin respuesta'].includes(String(item.status || '').toLowerCase())).length],
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <AdminSidebar />
      <main className="px-4 py-4 transition-all md:ml-[248px] md:px-6">
        <div className="mx-auto max-w-[1450px]">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {resource === 'clients'
                  ? 'Gestiona clientes, socios, responsables y etiquetas en un solo lugar.'
                  : 'Supervisa estados, responsables, prioridades y actividad operativa.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {resource === 'clients' && (
                <>
                  <ToolbarButton icon={Import} label="Importar" />
                  <ToolbarButton icon={Download} label="Exportar" />
                </>
              )}
              <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(22,199,102,0.24)]">
                <Plus className="h-4 w-4" />
                {resource === 'clients' ? 'Nuevo contacto' : 'Nuevo registro'}
              </button>
            </div>
          </header>

          {resource === 'clients' && (
            <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map(([label, value], index) => (
                <article key={label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${index === 3 ? 'bg-pending-soft text-pending' : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'}`}>
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)]">{label}</p>
                      <p className="mt-1 text-2xl font-black">{value}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          <section className="mb-4 grid gap-3 lg:grid-cols-[1fr_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Buscar ${title.toLowerCase()}...`}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-3 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
              />
            </div>
            <button className="inline-flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
              <span className="inline-flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Todos los responsables
              </span>
              <span className="text-[var(--color-text-muted)]">⌄</span>
            </button>
          </section>

          <div className="mb-4 flex flex-wrap gap-2">
            {['all', 'activo', 'pendiente', 'sin respuesta'].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                  filter === value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                }`}
              >
                {value === 'all' ? 'Todos' : value}
              </button>
            ))}
          </div>

          {loading && (
            <div className="mb-3 rounded-lg border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-text)]">
              Cargando datos del CRM...
            </div>
          )}
          {loadError && (
            <div role="alert" className="mb-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              No se pudieron cargar los registros. Comprueba la conexión e inténtalo de nuevo.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">{loading ? 'Cargando registros...' : loadError ? 'Registros no disponibles.' : 'No hay registros para mostrar.'}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] bg-[var(--color-background)] text-xs text-[var(--color-text-muted)]">
                    <tr>
                      {(resource === 'clients'
                        ? ['Nombre', 'Teléfono', 'Etiqueta', 'Última interacción', 'Estado', 'Responsable', 'Acciones']
                        : resource === 'conversations'
                          ? ['Cliente', 'Canal', 'Estado', 'Prioridad', 'Modo IA', 'Responsable', 'Acciones']
                          : ['Asunto', 'Categoría', 'Prioridad', 'Estado', 'Creado', 'Responsable', 'Acciones']
                      ).map((heading) => (
                        <th key={heading} className="px-5 py-4 font-bold">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filtered.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-[var(--color-background)]">
                        {resource === 'clients' && <ClientRow item={item} />}
                        {resource === 'conversations' && <ConversationRow item={item} />}
                        {resource === 'tickets' && <TicketRow item={item} />}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const ToolbarButton: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-bold text-[var(--color-text)]">
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const ClientRow: React.FC<{ item: any }> = ({ item }) => (
  <>
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <Avatar name={item.name} />
        <div>
          <p className="font-bold">{item.name || 'Sin nombre'}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{item.company || 'Cliente EPSA'}</p>
        </div>
      </div>
    </td>
    <td className="px-5 py-4 text-[var(--color-text-muted)]">{item.whatsapp_number || '-'}</td>
    <td className="px-5 py-4"><Badge value={item.tag || 'Cliente'} /></td>
    <td className="px-5 py-4"><p className="font-semibold">{formatDate(item.last_interaction_at)}</p><p className="max-w-[220px] truncate text-xs text-[var(--color-text-muted)]">{item.last_message || 'Sin actividad reciente'}</p></td>
    <td className="px-5 py-4"><Status value={item.status} /></td>
    <td className="px-5 py-4">{item.responsible || 'Sin asignar'}</td>
    <td className="px-5 py-4"><RowActions /></td>
  </>
);

const ConversationRow: React.FC<{ item: any }> = ({ item }) => (
  <>
    <td className="px-5 py-4"><p className="font-bold">{item.client?.name || 'Sin nombre'}</p><p className="text-xs text-[var(--color-text-muted)]">{item.client?.whatsapp_number || item.session_id}</p></td>
    <td className="px-5 py-4 text-[var(--color-text-muted)]">{item.channel || 'WhatsApp'}</td>
    <td className="px-5 py-4"><Status value={item.status} /></td>
    <td className="px-5 py-4"><Badge value={item.priority || 'normal'} /></td>
    <td className="px-5 py-4 text-[var(--color-text-muted)]">{item.ai_mode || 'AI_ASSIST'}</td>
    <td className="px-5 py-4">{item.assigned_user?.name || 'Sin asignar'}</td>
    <td className="px-5 py-4"><RowActions /></td>
  </>
);

const TicketRow: React.FC<{ item: any }> = ({ item }) => (
  <>
    <td className="px-5 py-4"><p className="font-bold">{item.subject || 'Sin asunto'}</p><p className="text-xs text-[var(--color-text-muted)]">#{item.id}</p></td>
    <td className="px-5 py-4 text-[var(--color-text-muted)]">{item.category || 'General'}</td>
    <td className="px-5 py-4"><Badge value={item.priority || 'P3'} /></td>
    <td className="px-5 py-4"><Status value={item.status || 'NUEVO'} /></td>
    <td className="px-5 py-4 text-[var(--color-text-muted)]">{formatDate(item.created_at)}</td>
    <td className="px-5 py-4">{item.assigned_to || 'Despacho'}</td>
    <td className="px-5 py-4"><RowActions /></td>
  </>
);

const Avatar: React.FC<{ name?: string | null }> = ({ name }) => (
  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)] ring-1 ring-[var(--color-primary-border)]">
    {initials(name)}
  </span>
);

const Badge: React.FC<{ value?: string }> = ({ value }) => (
  <span className="inline-flex rounded-md bg-[var(--color-primary-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-primary)]">
    {value || 'N/D'}
  </span>
);

const Status: React.FC<{ value?: string }> = ({ value = 'Activo' }) => {
  const lower = value.toLowerCase();
  const tone = lower.includes('pendiente') || lower.includes('nuevo')
    ? 'bg-pending-soft text-pending'
    : lower.includes('sin') || lower.includes('cerrado')
      ? 'bg-danger-soft text-danger'
      : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{value}</span>;
};

const RowActions = () => (
  <div className="flex gap-2">
    <button className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-bold">
      <Eye className="h-3.5 w-3.5" />
      Ver ficha
    </button>
    <button className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2">
      <MoreHorizontal className="h-4 w-4" />
    </button>
  </div>
);

const formatDate = (value?: string) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const ConversationsPage = () => <AdminResourcePages resource="conversations" />;
export const ClientsPage = () => <AdminResourcePages resource="clients" />;
export const TicketsPage = () => <AdminResourcePages resource="tickets" />;
