
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardIaStatus, DashboardIntent, DashboardMessage, DashboardStats } from '../types';
import AdminSidebar from '../components/AdminSidebar';

const emptyStats: DashboardStats = {
  total_clients: 0, active_clients: 0, new_clients_today: 0,
  total_conversations: 0, active_conversations: 0, conversations_today: 0,
  total_messages: 0, messages_today: 0, messages_week: 0,
  total_tickets: 0, open_tickets: 0, resolved_tickets: 0, urgent_tickets: 0,
  total_intents: 0, active_intents: 0,
};

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [intents, setIntents] = useState<DashboardIntent[]>([]);
  const [iaStatus, setIaStatus] = useState<DashboardIaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [nextStats, nextMessages, nextIntents, nextIaStatus] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentDashboardMessages(),
          api.getTopIntents(),
          api.getIaStatus(),
        ]);
        setStats(nextStats);
        setMessages(nextMessages);
        setIntents(nextIntents);
        setIaStatus(nextIaStatus);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const cards = [
    ['Clientes', stats.total_clients, `${stats.new_clients_today} nuevos hoy`, 'bg-sky-600'],
    ['Conversaciones activas', stats.active_conversations, `${stats.conversations_today} hoy`, 'bg-emerald-600'],
    ['Mensajes', stats.total_messages, `${stats.messages_today} hoy`, 'bg-amber-600'],
    ['Tickets abiertos', stats.open_tickets, `${stats.urgent_tickets} urgentes`, 'bg-rose-600'],
    ['Medidores activos', stats.active_meters ?? 0, `${stats.total_meters ?? 0} registrados`, 'bg-cyan-600'],
    ['Saldo pendiente', `Bs ${Number(stats.outstanding_amount ?? 0).toFixed(2)}`, `${stats.pending_bills ?? 0} facturas`, 'bg-violet-600'],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminSidebar />
      <header className="border-b border-slate-800 bg-slate-900/90 px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between md:ml-64">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">Water CRM IA</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Centro de operaciones</h1>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Actualización automática</p>
            <p className="mt-1 text-emerald-400">● Sistema operativo</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8 md:ml-64">
        {error && <div className="border border-rose-800 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {loading && <div className="h-1 animate-pulse bg-teal-500" />}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {cards.map(([label, value, detail, color]) => (
            <article key={label} className="border border-slate-800 bg-slate-900 p-5">
              <div className={`mb-5 h-1 w-12 ${color}`} />
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{value}</p>
              <p className="mt-2 text-xs text-slate-500">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div><h2 className="font-semibold">Actividad reciente</h2><p className="mt-1 text-xs text-slate-500">Últimos mensajes procesados por el sistema</p></div>
              <span className="text-xs text-slate-500">{messages.length} eventos</span>
            </div>
            <div className="divide-y divide-slate-800">
              {messages.length === 0 && <p className="px-5 py-10 text-sm text-slate-500">Todavía no hay actividad.</p>}
              {messages.map((message) => (
                <div key={message.id} className="grid grid-cols-[auto_1fr_auto] gap-3 px-5 py-4">
                  <span className={`mt-1 h-2 w-2 rounded-full ${message.sender === 'user' ? 'bg-sky-400' : 'bg-teal-400'}`} />
                  <div className="min-w-0"><p className="truncate text-sm text-slate-200">{message.text}</p><p className="mt-1 text-xs text-slate-500">{message.client_name} · {message.whatsapp_number}</p></div>
                  <div className="text-right text-xs text-slate-500"><p>{message.created_at || 'Ahora'}</p>{message.intent && <p className="mt-1 text-teal-400">{message.intent}</p>}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Intenciones principales</h2>
            <p className="mt-1 text-xs text-slate-500">Distribución de solicitudes recibidas</p>
            <div className="mt-6 space-y-4">
              {intents.length === 0 && <p className="text-sm text-slate-500">Sin datos suficientes.</p>}
              {intents.map((item, index) => { const max = intents[0]?.count || 1; return <div key={item.intent}><div className="mb-1 flex justify-between text-xs"><span>{item.intent}</span><span className="text-slate-500">{item.count}</span></div><div className="h-2 bg-slate-800"><div className={`h-2 ${index === 0 ? 'bg-teal-400' : 'bg-sky-500'}`} style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} /></div></div>; })}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Ollama</p><p className={`mt-2 text-lg font-semibold ${iaStatus?.ollama_status === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`}>{iaStatus?.ollama_status === 'connected' ? 'Conectado' : 'Desconectado'}</p></div>
          <div className="border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Confianza promedio</p><p className="mt-2 text-lg font-semibold">{Math.round((iaStatus?.average_confidence || 0) * 100)}%</p></div>
          <div className="border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Tickets resueltos</p><p className="mt-2 text-lg font-semibold">{stats.resolved_tickets}</p></div>
        </section>
      </main>
    </div>
  );
};

export default AdminPage;
