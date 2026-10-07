import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../services/api';

const ConversationDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const load = () =>
    api
      .getConversationMessages(id)
      .then((result) => setMessages(result?.data || result || []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [id]);

  const action = async (type: 'finished' | 'transferred') => {
    await api.updateConversationStatus(id, type);
    setActionMessage(type === 'finished' ? 'Conversación finalizada.' : 'Conversación transferida a un operador.');
    load();
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-5 py-6 text-[var(--color-text)] md:px-8 md:ml-64">
      <AdminSidebar />
      <div className="mx-auto flex max-w-5xl flex-col">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/admin/conversations" className="text-xs text-[var(--color-text-muted)]">← Volver a conversaciones</Link>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Conversación #{id}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => action('transferred')} className="border border-border-mid bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)]">Transferir</button>
            <button onClick={() => action('finished')} className="border border-border-mid bg-text-primary px-3 py-2 text-xs text-white">Finalizar</button>
          </div>
        </div>

        {actionMessage && <p className="mt-4 border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text)]">{actionMessage}</p>}

        <div className="mt-6 space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          {loading ? (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">Cargando conversación...</p>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">No hay mensajes.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] border px-4 py-3 ${message.sender === 'user' ? 'border-[var(--color-border)] bg-[var(--color-background)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
                  <p className="text-xs uppercase text-[var(--color-text-muted)]">{message.sender}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text)]">{message.text}</p>
                  <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                    {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
                    {message.intent ? ` · ${message.intent}` : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationDetailPage;