import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { DashboardIaStatus, DashboardIntent, DashboardMessage, DashboardStats } from '../types';
import AdminSidebar from '../components/AdminSidebar';

const getStoredSidebarState = () => localStorage.getItem('water-crm-sidebar') === 'collapsed';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => getStoredSidebarState());
  const loadingRef = useRef(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('water-crm-sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      const results = await Promise.allSettled([
          api.getDashboardStats(),
          api.getRecentDashboardMessages(),
          api.getTopIntents(),
          api.getIaStatus(),
      ]);

      const [statsResult, messagesResult, intentsResult, iaResult] = results;
      const failures = results.filter((result) => result.status === 'rejected');
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
      if (messagesResult.status === 'fulfilled') setMessages(messagesResult.value);
      if (intentsResult.status === 'fulfilled') setIntents(intentsResult.value);
      if (iaResult.status === 'fulfilled') setIaStatus(iaResult.value);
      setError(failures.length ? 'Algunos datos no respondieron. Render puede estar despertando.' : null);
      setLoading(false);
      loadingRef.current = false;
    };

    loadData();
    const interval = setInterval(loadData, 20000);
    
    return () => clearInterval(interval);
  }, []);

  const cards = [
    ['Clientes', stats.total_clients, `${stats.new_clients_today} nuevos hoy`, 'bg-slate-800'],
    ['Conversaciones activas', stats.active_conversations, `${stats.conversations_today} hoy`, 'bg-slate-700'],
    ['Mensajes', stats.total_messages, `${stats.messages_today} hoy`, 'bg-slate-600'],
    ['Tickets abiertos', stats.open_tickets, `${stats.urgent_tickets} urgentes`, 'bg-[var(--color-background)]0'],
    ['Medidores activos', stats.active_meters ?? 0, `${stats.total_meters ?? 0} registrados`, 'bg-slate-400'],
    ['Saldo pendiente', `Bs ${Number(stats.outstanding_amount ?? 0).toFixed(2)}`, `${stats.pending_bills ?? 0} facturas`, 'bg-slate-300'],
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <header className={`border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 md:px-8 ${sidebarCollapsed ? 'md:ml-[86px]' : 'md:ml-[280px]'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Water CRM IA</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text)]">Centro de operaciones</h1>
          </div>
          <div className="text-right text-xs text-[var(--color-text-muted)]">
            <p>Actualización automática</p>
            <p className="mt-1 text-online">● Sistema operativo</p>
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8 ${sidebarCollapsed ? 'md:ml-[86px]' : 'md:ml-[280px]'}`}>
        {error && <div className="border border-rose-200 bg-danger-soft px-4 py-3 text-sm text-rose-700">{error}</div>}
        {loading && <div className="h-1 animate-pulse bg-slate-300" />}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {cards.map(([label, value, detail, color]) => (
            <article key={label} className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
              <div className={`mb-5 h-1 w-12 ${color}`} />
              <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div><h2 className="font-semibold text-[var(--color-text)]">Actividad reciente</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Últimos mensajes procesados por el sistema</p></div>
              <span className="text-xs text-[var(--color-text-muted)]">{messages.length} eventos</span>
            </div>
            <div className="divide-y divide-slate-200">
              {messages.length === 0 && <p className="px-5 py-10 text-sm text-[var(--color-text-muted)]">Todavía no hay actividad.</p>}
              {messages.map((message) => (
                <div key={message.id} className="grid grid-cols-[auto_1fr_auto] gap-3 px-5 py-4">
                  <span className={`mt-1 h-2 w-2 rounded-full ${message.sender === 'user' ? 'bg-slate-700' : 'bg-[var(--color-background)]0'}`} />
                  <div className="min-w-0"><p className="truncate text-sm text-[var(--color-text)]">{message.text}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{message.client_name} · {message.whatsapp_number}</p></div>
                  <div className="text-right text-xs text-[var(--color-text-muted)]"><p>{message.created_at || 'Ahora'}</p>{message.intent && <p className="mt-1 text-[var(--color-text)]">{message.intent}</p>}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <h2 className="font-semibold text-[var(--color-text)]">Intenciones principales</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Distribución de solicitudes recibidas</p>
            <div className="mt-6 space-y-4">
              {intents.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">Sin datos suficientes.</p>}
              {intents.map((item, index) => { const max = intents[0]?.count || 1; return <div key={item.intent}><div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)]"><span>{item.intent}</span><span className="text-[var(--color-text-muted)]">{item.count}</span></div><div className="h-2 bg-[var(--color-surface-alt)]"><div className={`h-2 ${index === 0 ? 'bg-slate-700' : 'bg-[var(--color-background)]0'}`} style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} /></div></div>; })}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Proveedor IA: {iaStatus?.ia_provider || 'groq'}</p><p className={`mt-2 text-lg font-semibold ${iaStatus?.provider_status === 'connected' ? 'text-online' : 'text-danger'}`}>{iaStatus?.provider_status === 'connected' ? 'Conectado' : iaStatus?.provider_status === 'disabled' ? 'Desactivado' : 'Desconectado'}</p></div>
          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Confianza promedio</p><p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{Math.round((iaStatus?.average_confidence || 0) * 100)}%</p></div>
          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Tickets resueltos</p><p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{stats.resolved_tickets}</p></div>
        </section>
      </main>
    </div>
  );
};

export default AdminPage;
