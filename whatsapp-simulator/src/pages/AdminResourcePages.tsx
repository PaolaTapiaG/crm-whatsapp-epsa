import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';

type Resource = 'clients' | 'conversations' | 'tickets';

const AdminResourcePages: React.FC<{ resource: Resource }> = ({ resource }) => {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    api.getAdminResource(resource, { per_page: 50 }).then((result) => {
      if (mounted) setData(Array.isArray(result) ? result : (result?.data || []));
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [resource]);

  const title = resource === 'clients' ? 'Clientes' : resource === 'conversations' ? 'Conversaciones' : 'Tickets';
  const filtered = useMemo(() => data.filter((item) => {
    const haystack = JSON.stringify(item).toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const status = item.status || 'all';
    return matchesSearch && (filter === 'all' || status === filter);
  }), [data, filter, search]);

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100 md:px-8 md:ml-64">
      <AdminSidebar />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-xs uppercase tracking-[0.2em] text-teal-400">Gestión operativa</p><h1 className="mt-2 text-3xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-500">Consulta, filtra y supervisa la operación.</p></div>
          <span className="text-xs text-slate-500">{filtered.length} registros</span>
        </div>
        <div className="mb-5 flex flex-col gap-3 border border-slate-800 bg-slate-900 p-4 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${title.toLowerCase()}...`} className="flex-1 border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 outline-none focus:border-teal-400" />
          {resource !== 'clients' && <select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 outline-none"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="open">Abiertos</option><option value="pending">Pendientes</option><option value="resolved">Resueltos</option><option value="closed">Cerrados</option><option value="transferred">Transferidos</option></select>}
        </div>
        <div className="overflow-hidden border border-slate-800 bg-slate-900">
          {loading ? <div className="p-10 text-center text-sm text-slate-500">Cargando registros...</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No hay registros para mostrar.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500"><tr>{(resource === 'clients' ? ['Cliente', 'WhatsApp', 'Estado', 'Última interacción'] : resource === 'conversations' ? ['Cliente', 'Canal', 'Estado', 'Prioridad', 'Mensajes'] : ['Asunto', 'Categoría', 'Prioridad', 'Estado', 'Creado']).map((heading) => <th key={heading} className="px-5 py-4 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{filtered.map((item) => <tr key={item.id} className="hover:bg-slate-800/50">{resource === 'clients' && <><td className="px-5 py-4"><p className="font-medium text-slate-200">{item.name || 'Sin nombre'}</p><p className="mt-1 text-xs text-slate-500">#{item.id}</p></td><td className="px-5 py-4 text-slate-400">{item.whatsapp_number}</td><td className="px-5 py-4"><Badge value={item.status} /></td><td className="px-5 py-4 text-slate-500">{item.last_interaction_at ? new Date(item.last_interaction_at).toLocaleString() : 'Sin actividad'}</td></>}{resource === 'conversations' && <><td className="px-5 py-4"><p className="font-medium text-slate-200">{item.client?.name || 'Sin nombre'}</p><p className="mt-1 text-xs text-slate-500">{item.client?.whatsapp_number || item.session_id}</p></td><td className="px-5 py-4 text-slate-400">{item.channel}</td><td className="px-5 py-4"><Badge value={item.status} /></td><td className="px-5 py-4"><Badge value={item.priority} /></td><td className="px-5 py-4 text-slate-400">{item.messages_count ?? item.messages?.length ?? 0}</td></>}{resource === 'tickets' && <><td className="px-5 py-4"><p className="font-medium text-slate-200">{item.subject}</p><p className="mt-1 max-w-xs truncate text-xs text-slate-500">{item.description}</p></td><td className="px-5 py-4 text-slate-400">{item.category}</td><td className="px-5 py-4"><Badge value={item.priority} /></td><td className="px-5 py-4"><Badge value={item.status} /></td><td className="px-5 py-4 text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td></>}</tr>)}</tbody></table></div>}
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC<{ value?: string }> = ({ value }) => <span className="inline-flex border border-slate-700 px-2 py-1 text-xs text-slate-300">{value || 'N/D'}</span>;

export const ConversationsPage = () => <AdminResourcePages resource="conversations" />;
export const ClientsPage = () => <AdminResourcePages resource="clients" />;
export const TicketsPage = () => <AdminResourcePages resource="tickets" />;