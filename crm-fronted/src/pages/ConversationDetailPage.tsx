import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../services/api';

const ConversationDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const load = () => api.getConversationMessages(id).then((result) => setMessages(result?.data || result || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);
  const action = async (type: 'finished' | 'transferred') => { await api.updateConversationStatus(id, type); setActionMessage(type === 'finished' ? 'Conversación finalizada.' : 'Conversación transferida a un operador.'); load(); };

  return <div className="min-h-screen bg-slate-950 px-5 py-6 text-slate-100 md:px-8 ml-64"><AdminSidebar /><div className="mx-auto flex max-w-5xl flex-col"><div className="flex items-center justify-between"><div><Link to="/admin/conversations" className="text-xs text-teal-400">← Volver a conversaciones</Link><h1 className="mt-2 text-3xl font-semibold">Conversación #{id}</h1></div><div className="flex gap-2"><button onClick={() => action('transferred')} className="border border-amber-700 px-3 py-2 text-xs text-amber-300">Transferir</button><button onClick={() => action('finished')} className="border border-rose-700 px-3 py-2 text-xs text-rose-300">Finalizar</button></div></div>{actionMessage && <p className="mt-4 border border-emerald-700 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{actionMessage}</p>}<div className="mt-6 space-y-4 border border-slate-800 bg-slate-900 p-5">{loading ? <p className="py-10 text-center text-sm text-slate-500">Cargando conversación...</p> : messages.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No hay mensajes.</p> : messages.map((message) => <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] border px-4 py-3 ${message.sender === 'user' ? 'border-sky-800 bg-sky-950/50' : 'border-slate-700 bg-slate-800'}`}><p className="text-xs uppercase text-slate-500">{message.sender}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{message.text}</p><p className="mt-2 text-[11px] text-slate-500">{message.created_at ? new Date(message.created_at).toLocaleString() : ''}{message.intent ? ` · ${message.intent}` : ''}</p></div></div>)}</div></div></div>;
};

export default ConversationDetailPage;