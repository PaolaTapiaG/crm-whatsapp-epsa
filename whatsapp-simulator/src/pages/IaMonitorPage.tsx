import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardIaStatus, DashboardIntent } from '../types';
import AdminSidebar from '../components/AdminSidebar';

const IaMonitorPage: React.FC = () => {
  const [status, setStatus] = useState<DashboardIaStatus | null>(null);
  const [intents, setIntents] = useState<DashboardIntent[]>([]);

  useEffect(() => { Promise.all([api.getIaStatus(), api.getTopIntents()]).then(([nextStatus, nextIntents]) => { setStatus(nextStatus); setIntents(nextIntents); }); }, []);

  return <div className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100 md:px-8 ml-64"><AdminSidebar /><div className="mx-auto max-w-7xl"><p className="text-xs uppercase tracking-[0.2em] text-teal-400">Inteligencia artificial</p><h1 className="mt-2 text-3xl font-semibold">Monitor IA</h1><div className="mt-6 grid gap-4 md:grid-cols-3"><div className="border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase text-slate-500">Ollama</p><p className={`mt-3 text-xl font-semibold ${status?.ollama_status === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`}>{status?.ollama_status === 'connected' ? 'Conectado' : 'Desconectado'}</p></div><div className="border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase text-slate-500">Mensajes analizados</p><p className="mt-3 text-3xl font-semibold">{status?.total_messages_analyzed ?? 0}</p></div><div className="border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase text-slate-500">Confianza promedio</p><p className="mt-3 text-3xl font-semibold">{Math.round((status?.average_confidence ?? 0) * 100)}%</p></div></div><div className="mt-6 border border-slate-800 bg-slate-900 p-5"><h2 className="font-semibold">Intenciones detectadas</h2><div className="mt-6 space-y-4">{intents.map((intent, index) => <div key={intent.intent}><div className="mb-1 flex justify-between text-sm"><span>{intent.intent}</span><span className="text-slate-500">{intent.count}</span></div><div className="h-2 bg-slate-800"><div className={index === 0 ? 'h-2 bg-teal-400' : 'h-2 bg-sky-500'} style={{ width: `${Math.max(8, (intent.count / (intents[0]?.count || 1)) * 100)}%` }} /></div></div>)}</div></div></div></div>;
};

export default IaMonitorPage;