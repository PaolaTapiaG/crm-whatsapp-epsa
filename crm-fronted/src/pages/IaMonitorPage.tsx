import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardIaStatus, DashboardIntent } from '../types';
import AdminSidebar from '../components/AdminSidebar';

const IaMonitorPage: React.FC = () => {
  const [status, setStatus] = useState<DashboardIaStatus | null>(null);
  const [intents, setIntents] = useState<DashboardIntent[]>([]);

  useEffect(() => {
    Promise.all([api.getIaStatus(), api.getTopIntents()]).then(([nextStatus, nextIntents]) => {
      setStatus(nextStatus);
      setIntents(nextIntents);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-5 py-6 text-[var(--color-text)] md:px-8 md:ml-64">
      <AdminSidebar />
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Inteligencia artificial</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Monitor IA</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-xs uppercase text-[var(--color-text-muted)]">Proveedor IA: {status?.ia_provider || 'groq'}</p>
            <p className={`mt-3 text-xl font-semibold ${status?.provider_status === 'connected' ? 'text-[var(--color-text)]' : 'text-[var(--color-text)]'}`}>
              {status?.provider_status === 'connected' ? 'Conectado' : status?.provider_status === 'disabled' ? 'Desactivado' : 'Desconectado'}
            </p>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-xs uppercase text-[var(--color-text-muted)]">Mensajes analizados</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{status?.total_messages_analyzed ?? 0}</p>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
            <p className="text-xs uppercase text-[var(--color-text-muted)]">Confianza promedio</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{Math.round((status?.average_confidence ?? 0) * 100)}%</p>
          </div>
        </div>

        <div className="mt-6 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--color-text)]">Intenciones detectadas</h2>
          <div className="mt-6 space-y-4">
            {intents.map((intent, index) => (
              <div key={intent.intent}>
                <div className="mb-1 flex justify-between text-sm text-[var(--color-text)]">
                  <span>{intent.intent}</span>
                  <span className="text-[var(--color-text-muted)]">{intent.count}</span>
                </div>
                <div className="h-2 bg-[var(--color-surface-alt)]">
                  <div
                    className={index === 0 ? 'h-2 bg-slate-900' : 'h-2 bg-slate-700'}
                    style={{ width: `${Math.max(8, (intent.count / (intents[0]?.count || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IaMonitorPage;