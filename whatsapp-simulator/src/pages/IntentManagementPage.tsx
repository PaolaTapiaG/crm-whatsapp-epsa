import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../services/api';

const IntentManagementPage: React.FC = () => {
  const [intents, setIntents] = useState<any[]>([]);
  const [test, setTest] = useState('');
  const [result, setResult] = useState<any>(null);
  useEffect(() => { api.getAdminIntents().then((data) => setIntents(data?.data || data || [])); }, []);
  const runTest = async () => { if (!test.trim()) return; const response = await api.sendMessage('+59170000001', test, `intent-test-${Date.now()}`); setResult(response.data); };

  return <div className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100 md:px-8 ml-64"><AdminSidebar /><div className="mx-auto max-w-6xl"><p className="text-xs uppercase tracking-[0.2em] text-teal-400">Ollama</p><h1 className="mt-2 text-3xl font-semibold">Intenciones IA</h1><section className="mt-6 border border-slate-800 bg-slate-900 p-5"><h2 className="font-semibold">Probar clasificación</h2><div className="mt-4 flex gap-3"><input value={test} onChange={(e) => setTest(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runTest()} placeholder="Escribe un mensaje..." className="flex-1 border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200" /><button onClick={runTest} className="bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950">Probar</button></div>{result && <p className="mt-4 border border-slate-700 bg-slate-950 p-3 text-sm">Intención: <strong>{result.analysis?.intent}</strong> · Confianza: {result.analysis?.confidence}%</p>}</section><section className="mt-6 overflow-hidden border border-slate-800 bg-slate-900"><table className="w-full text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Intención</th><th className="px-5 py-4">Descripción</th><th className="px-5 py-4">Prioridad</th><th className="px-5 py-4">Estado</th></tr></thead><tbody className="divide-y divide-slate-800">{intents.map((intent) => <tr key={intent.id}><td className="px-5 py-4 font-medium text-slate-200">{intent.name}</td><td className="px-5 py-4 text-slate-400">{intent.description || 'Sin descripción'}</td><td className="px-5 py-4 text-slate-400">{intent.priority ?? '-'}</td><td className="px-5 py-4 text-teal-400">{intent.is_active ? 'Activa' : 'Inactiva'}</td></tr>)}</tbody></table></section></div></div>;
};

export default IntentManagementPage;