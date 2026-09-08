import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  ImagePlus,
  MapPin,
  MessageCircle,
  Moon,
  QrCode,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  Users,
  XCircle,
  Menu,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../services/api';

type ChatFilter = 'active' | 'recent' | 'groups' | 'all';
type MobileView = 'chats' | 'chat' | 'tools';

interface Conversation {
  id: number;
  client_id?: number;
  status: string;
  priority: string;
  channel?: string;
  updated_at?: string;
  metadata?: { group_name?: string; is_group?: boolean };
  client?: { name?: string; whatsapp_number: string; address?: string; metadata?: Record<string, string> };
  last_message?: { id?: number; sender?: string; text: string; created_at?: string };
}

interface Message {
  id: number;
  sender: string;
  text: string;
  metadata?: { kind?: string; media_url?: string; payment_status?: string; path?: string };
  created_at: string;
}

const quickReplies = [
  'Su pago esta en revision por el operador, espere unos minutos antes de recibir su factura.',
  'Gracias por contactarnos. Un operador revisara su solicitud.',
  'Por favor envie una foto clara del comprobante de pago por QR.',
  'Necesitamos su nombre completo para continuar con el menu de atencion.',
];

const templates = [
  {
    name: 'Corte programado',
    text: 'Aviso EPSA El Portillo: manana se realizara un corte programado por mantenimiento de canerias. Restableceremos el servicio lo antes posible.',
  },
  {
    name: 'Problema de canerias',
    text: 'Aviso EPSA El Portillo: existe un problema con las canerias en su zona. Nuestro equipo tecnico ya esta atendiendo el caso.',
  },
  {
    name: 'Pago recibido',
    text: 'Recibimos su comprobante. Su pago esta en revision por el operador, espere unos minutos antes de recibir su factura.',
  },
];

const initialInvoice = {
  bill_number: '007504',
  user_name: '',
  previous_reading: '',
  current_reading: '',
  consumption: '',
  basic_rate: '',
  tier_11_15: '',
  tier_16_20: '',
  tier_20_30: '',
  amount: '',
  amount_literal: '',
  day: '',
  month: '',
  year: '2026',
};

const invoiceLabels: Record<keyof typeof initialInvoice, string> = {
  bill_number: 'Numero de recibo',
  user_name: 'Nombre del usuario',
  previous_reading: 'Lectura anterior m3',
  current_reading: 'Lectura actual m3',
  consumption: 'Consumo m3',
  basic_rate: 'Tarifa basica 10 m3',
  tier_11_15: '11 a 15 m3',
  tier_16_20: '16 a 20 m3',
  tier_20_30: '20 a 30 m3',
  amount: 'Total Bs.',
  amount_literal: 'Monto literal',
  day: 'Dia',
  month: 'Mes',
  year: 'Ano',
};

const inputBase = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const panelBase = 'rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
};

const conversationActivityTime = (conversation: Conversation): number => {
  const activity = conversation.last_message?.created_at || conversation.updated_at;
  const timestamp = activity ? Date.parse(activity) : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const OperatorChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ChatFilter>('active');
  const [mobileView, setMobileView] = useState<MobileView>('chats');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('water-crm-sidebar') === 'collapsed');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('water-crm-theme') !== 'light');
  const [qr, setQr] = useState<File | null>(null);
  const [invoice, setInvoice] = useState(initialInvoice);
  const [noticeText, setNoticeText] = useState(templates[0].text);
  const [noticeRecipients, setNoticeRecipients] = useState('');
  const [noticeImage, setNoticeImage] = useState<File | null>(null);
  const [profile, setProfile] = useState(() => readStored('water-crm-company-profile', { displayName: 'EPSA El Portillo', role: 'Servicio de agua potable', photo: '' }));
  const [location, setLocation] = useState(() => readStored('water-crm-company-location', {
    latitude: '-17.3895',
    longitude: '-66.1568',
    name: 'EPSA El Portillo',
    address: 'Oficina central de atencion',
  }));
  const [notice, setNotice] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('water-crm-sound') !== 'off');
  const latestActivityRef = useRef('');
  const conversationsLoadingRef = useRef(false);
  const messagesLoadingRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('water-crm-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('water-crm-company-profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('water-crm-company-location', JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    const syncTheme = (event: Event) => setDarkMode(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('water-crm-theme-change', syncTheme);
    return () => window.removeEventListener('water-crm-theme-change', syncTheme);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('water-crm-sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  const loadConversations = async () => {
    if (conversationsLoadingRef.current) return;
    conversationsLoadingRef.current = true;
    try {
      const next = await api.getOperatorConversations();
      const inboundActivity = next
        .filter((conversation: Conversation) => conversation.last_message?.sender === 'user')
        .map((conversation: Conversation) => `${conversation.last_message?.id || ''}:${conversation.last_message?.created_at || ''}`)
        .sort().pop() || '';
      if (latestActivityRef.current && inboundActivity && inboundActivity !== latestActivityRef.current) {
        notifyOperator('Nuevo mensaje recibido', 'Hay un mensaje nuevo de un cliente en WhatsApp.');
      }
      if (inboundActivity) latestActivityRef.current = inboundActivity;
      const ordered = [...next].sort((left, right) => conversationActivityTime(right) - conversationActivityTime(left));
      setConversations(ordered);
      setActive((current) => {
        if (!current) return ordered[0] ?? null;
        return ordered.find((conversation) => conversation.id === current.id) ?? current;
      });
    } catch {
      // Preserve the last known list while Render or Neon recovers.
    } finally {
      conversationsLoadingRef.current = false;
    }
  };

  const loadMessages = async (id: number) => {
    if (messagesLoadingRef.current === id) return;
    messagesLoadingRef.current = id;
    try {
      const result = await api.getOperatorMessages(String(id));
      setMessages(Array.isArray(result.data) ? result.data : []);
    } catch {
      // Preserve visible chat history during a transient request failure.
    } finally {
      messagesLoadingRef.current = null;
    }
  };

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(loadConversations, 8000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!active) return;
    setInvoice((current) => ({ ...current, user_name: active.client?.name || current.user_name }));
    loadMessages(active.id);
    const timer = window.setInterval(() => loadMessages(active.id), 5000);
    return () => window.clearInterval(timer);
  }, [active?.id]);

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const isGroup = Boolean(conversation.metadata?.is_group || conversation.channel === 'whatsapp_group');
      const haystack = `${conversation.client?.name || ''} ${conversation.client?.whatsapp_number || ''} ${conversation.metadata?.group_name || ''}`.toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && ['active', 'pending', 'transferred'].includes(conversation.status)) ||
        (filter === 'recent' && Boolean(conversation.last_message || conversation.updated_at)) ||
        (filter === 'groups' && isGroup);
      return matchesQuery && matchesFilter;
    });
  }, [conversations, filter, query]);

  const proofs = useMemo(() => messages.filter((message) => message.metadata?.kind === 'payment_proof'), [messages]);

  const sendText = async (content = text) => {
    if (!active || !content.trim()) return;
    await api.sendOperatorMessage({ to: active.client?.whatsapp_number || '', text: content, conversation_id: active.id });
    setText('');
    await loadMessages(active.id);
  };

  const sendQr = async () => {
    if (!active || !qr) return;
    try {
      await api.sendQr(active.id, active.client?.whatsapp_number || '', qr);
      setQr(null);
      setNotice('QR enviado al cliente.');
      await loadMessages(active.id);
    } catch (error: any) {
      setNotice(error.response?.data?.error || error.message || 'No se pudo enviar el QR.');
    }
  };

  const sendInvoice = async () => {
    if (!active || !invoice.bill_number) return;
    const calculatedAmount = [invoice.basic_rate, invoice.tier_11_15, invoice.tier_16_20, invoice.tier_20_30]
      .map((value) => Number(value) || 0).reduce((total, value) => total + value, 0);
    const amount = invoice.amount || (calculatedAmount ? calculatedAmount.toFixed(2) : '');
    if (!amount) return;
    try {
      await api.sendInvoice(active.id, { to: active.client?.whatsapp_number || '', ...invoice, amount });
      setNotice('Factura PDF plana enviada correctamente.');
      await loadMessages(active.id);
    } catch (error: any) {
      setNotice(error.response?.data?.error || error.message || 'No se pudo enviar la factura PDF.');
    }
  };

  const sendLocation = async () => {
    if (!active) return;
    await api.sendLocation(active.id, { to: active.client?.whatsapp_number || '', ...location });
    setNotice('Link de ubicacion enviado.');
    await loadMessages(active.id);
  };

  const sendBroadcast = async () => {
    const recipients = noticeRecipients.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
    if (recipients.length === 0 || !noticeText.trim()) return;
    await api.sendBroadcast({ recipients, text: noticeText, image: noticeImage });
    setNotice(`Aviso enviado a ${recipients.length} destino(s).`);
  };

  const review = async (messageId: number, status: 'approved' | 'rejected') => {
    await api.reviewPayment(messageId, status);
    if (active) await loadMessages(active.id);
  };

  const notifyOperator = (title: string, body: string) => {
    if (!soundEnabled) return;
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.05;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.18);
    } catch {
      // El navegador puede bloquear audio hasta que el operador interactue.
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const enableNotifications = async () => {
    setSoundEnabled(true);
    localStorage.setItem('water-crm-sound', 'on');
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    notifyOperator('Notificaciones activadas', 'El CRM avisara cuando llegue un mensaje nuevo.');
    setNotice('Notificaciones activadas para nuevos mensajes.');
  };

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current;
      localStorage.setItem('water-crm-sound', next ? 'on' : 'off');
      return next;
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-[#efeae2] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        companyProfile={profile}
        onCompanyProfileChange={setProfile}
        companyLocation={location}
        onCompanyLocationChange={setLocation}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
      <main className={`mx-auto flex h-full max-w-[1600px] flex-col px-3 py-3 transition-[margin] duration-200 sm:px-4 md:px-6 md:py-5 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-sky-600 dark:text-sky-300">Chat WA y operaciones</p>
            <h1 className="mt-1 text-2xl font-semibold">Centro de respuesta EPSA El Portillo</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Un chat por numero, historial completo, facturas, QR, avisos y plantillas.</p>
          </div>
          <div className="flex items-center gap-2">
            <button title="Abrir menú" onClick={() => setMobileSidebarOpen(true)} className="rounded-md border border-sky-200 p-2 text-sky-700 dark:border-slate-700 dark:text-sky-200 md:hidden"><Menu className="h-4 w-4" /></button>
            <button title="Activar notificaciones" onClick={enableNotifications} className="rounded-md border border-sky-200 p-2 text-sky-700 dark:border-slate-700 dark:text-sky-200">
              <Bell className="h-4 w-4" />
            </button>
            <button title="Modo claro u oscuro" onClick={() => { const next = !darkMode; setDarkMode(next); window.dispatchEvent(new CustomEvent('water-crm-theme-change', { detail: next })); }} className="rounded-md border border-sky-200 p-2 text-sky-700 dark:border-slate-700 dark:text-sky-200">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white">{conversations.length} chats</span>
          </div>
        </header>

        {notice && <div className="mb-4 rounded-md border border-sky-200 bg-sky-100 px-4 py-3 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100">{notice}</div>}

        <nav className="sticky top-0 z-10 mb-3 grid grid-cols-3 gap-1 rounded-lg bg-white p-1 shadow-sm dark:bg-slate-900 md:hidden">
          {([
            ['chats', 'Chats', MessageCircle],
            ['chat', 'Conversacion', Send],
            ['tools', 'Herramientas', Settings],
          ] as const).map(([value, label, Icon]) => (
            <button key={String(value)} onClick={() => setMobileView(value as MobileView)} className={`rounded-md px-2 py-2 text-xs font-semibold ${mobileView === value ? 'bg-[#25d366] text-slate-950' : 'text-slate-500'}`}>
              <Icon className="mx-auto mb-1 h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-[320px_minmax(420px,1fr)] xl:grid-cols-[340px_minmax(460px,1fr)_380px] xl:gap-4">
          <section className={`${panelBase} ${mobileView === 'chats' ? 'flex' : 'hidden'} min-h-0 flex-col md:flex`}>
            <div className="border-b border-sky-100 p-4 dark:border-slate-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre o numero" className={`${inputBase} pl-9`} />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 rounded-md bg-sky-50 p-1 dark:bg-slate-950">
                {[
                  ['active', 'Activos', MessageCircle],
                  ['recent', 'Recientes', Clock3],
                  ['groups', 'Grupos', Users],
                  ['all', 'Todo', Sparkles],
                ].map(([value, label, Icon]) => (
                  <button key={String(value)} title={String(label)} onClick={() => setFilter(value as ChatFilter)} className={`rounded px-2 py-2 text-xs ${filter === value ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-900'}`}>
                    <Icon className="mx-auto h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => {
                const selected = active?.id === conversation.id;
                return (
                  <button key={conversation.id} onClick={() => { setActive(conversation); setMobileView('chat'); }} className={`w-full border-b border-sky-50 px-4 py-4 text-left transition dark:border-slate-800 ${selected ? 'bg-sky-100 dark:bg-sky-950/70' : 'hover:bg-sky-50 dark:hover:bg-slate-800'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{conversation.metadata?.group_name || conversation.client?.name || 'Nombre pendiente'}</p>
                        <p className="mt-1 text-xs text-slate-500">{conversation.client?.whatsapp_number || 'Grupo WhatsApp'}</p>
                      </div>
                      <span className={`rounded px-2 py-1 text-[10px] uppercase ${conversation.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200' : 'bg-sky-100 text-sky-700 dark:bg-slate-800 dark:text-sky-200'}`}>{conversation.status}</span>
                    </div>
                    <p className="mt-3 truncate text-xs text-slate-500">{conversation.last_message?.text || 'Sin mensajes recientes'}</p>
                  </button>
                );
              })}
              {filteredConversations.length === 0 && <p className="px-4 py-10 text-sm text-slate-500">No hay chats con este filtro.</p>}
            </div>
          </section>

          <section className={`${panelBase} ${mobileView === 'chat' ? 'flex' : 'hidden'} min-h-0 flex-col md:flex`}>
            {active ? (
              <>
                <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4 dark:border-slate-800">
                  <div>
                    <h2 className="font-semibold">{active.client?.name || 'Nombre pendiente'}</h2>
                    <p className="mt-1 text-xs text-slate-500">{active.client?.whatsapp_number} · {active.status} · historial visible</p>
                  </div>
                  <div className="flex gap-2">
                    <button title="Enviar ubicacion" onClick={sendLocation} className="rounded-md border border-sky-200 p-2 text-sky-700 dark:border-slate-700 dark:text-sky-200"><MapPin className="h-4 w-4" /></button>
                    <button title="Cerrar chat" onClick={() => api.updateConversation(String(active.id), 'close')} className="rounded-md border border-rose-200 p-2 text-rose-600 dark:border-rose-900"><XCircle className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-[#efeae2] p-3 dark:bg-slate-950 sm:p-5">
                  {messages.map((message) => {
                    const outbound = ['human', 'bot'].includes(message.sender);
                    return (
                      <div key={message.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[88%] rounded-lg px-3 py-2 shadow-sm sm:max-w-[76%] ${outbound ? 'bg-[#d9fdd3] text-slate-900 dark:bg-[#005c4b] dark:text-white' : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'}`}>
                          <p className={`text-[10px] uppercase ${outbound ? 'text-emerald-700 dark:text-emerald-100' : 'text-slate-400'}`}>{message.sender}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                          {message.metadata?.media_url && <a className="mt-3 block text-xs underline" href={message.metadata.media_url} target="_blank" rel="noreferrer">{message.metadata.kind === 'invoice' ? 'Abrir factura PDF' : message.metadata.kind === 'payment_qr' ? 'Abrir QR enviado' : 'Abrir comprobante'}</a>}
                          {message.metadata?.kind === 'payment_proof' && (
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => review(message.id, 'approved')} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"><CheckCircle2 className="mr-1 inline h-3 w-3" />Aprobar</button>
                              <button onClick={() => review(message.id, 'rejected')} className="rounded bg-rose-600 px-2 py-1 text-xs text-white"><XCircle className="mr-1 inline h-3 w-3" />Rechazar</button>
                            </div>
                          )}
                          <p className={`mt-2 text-[10px] ${outbound ? 'text-sky-100' : 'text-slate-400'}`}>{new Date(message.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-sky-100 p-4 dark:border-slate-800">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {quickReplies.map((reply) => (
                      <button key={reply} onClick={() => sendText(reply)} className="rounded-md border border-sky-200 px-3 py-2 text-xs text-sky-700 hover:bg-sky-50 dark:border-slate-700 dark:text-sky-200 dark:hover:bg-slate-800">{reply.slice(0, 42)}...</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendText()} placeholder="Responder al cliente..." className={inputBase} />
                    <button title="Enviar" onClick={() => sendText()} className="rounded-md bg-sky-600 px-4 text-white"><Send className="h-4 w-4" /></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Selecciona un chat para ver su historial.</div>
            )}
          </section>

          <aside className={`${mobileView === 'tools' ? 'block' : 'hidden'} space-y-3 overflow-y-auto xl:block`}>
            <section className={`${panelBase} p-4`}>
              <h3 className="flex items-center gap-2 text-sm font-semibold"><QrCode className="h-4 w-4 text-sky-500" /> Cobro QR</h3>
              <input type="file" accept="image/*" onChange={(event) => setQr(event.target.files?.[0] || null)} className="mt-3 w-full text-xs" />
              <button disabled={!qr || !active} onClick={sendQr} className="mt-3 w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Enviar QR</button>
              <p className="mt-2 text-xs text-slate-500">{proofs.length} comprobante(s) en este chat.</p>
            </section>

            <section className={`${panelBase} p-4`}>
              <h3 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-sky-500" /> Factura PDF plana</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(invoice).map(([key, value]) => (
                  <label key={key} className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {invoiceLabels[key as keyof typeof initialInvoice]}
                    <input value={value} onChange={(event) => setInvoice({ ...invoice, [key]: event.target.value })} placeholder={invoiceLabels[key as keyof typeof initialInvoice]} className={`${inputBase} mt-1`} />
                  </label>
                ))}
              </div>
              <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-[10px] text-slate-900">
                <div className="flex justify-between"><strong>EPSA "EL PORTILLO"</strong><strong>RECIBO Nro {invoice.bill_number}</strong></div>
                <p className="mt-2">NOMBRE DEL USUARIO: {invoice.user_name || '........................'}</p>
                <div className="mt-2 grid grid-cols-3 border border-slate-800 text-center"><span>LECT. ANT. M3<br />{invoice.previous_reading}</span><span className="border-x border-slate-800">LECT. ACTUAL. M3<br />{invoice.current_reading}</span><span>CONSUMO M3<br />{invoice.consumption}</span></div>
                <p className="mt-2">TOTAL Bs. {invoice.amount || '0.00'}</p>
              </div>
              <button disabled={!active || !invoice.bill_number || (![invoice.amount, invoice.basic_rate, invoice.tier_11_15, invoice.tier_16_20, invoice.tier_20_30].some(Boolean))} onClick={sendInvoice} className="mt-3 w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Enviar PDF de factura</button>
            </section>

            <section className={`${panelBase} p-4`}>
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4 text-sky-500" /> Campanas y avisos</h3>
              <select onChange={(event) => setNoticeText(templates[Number(event.target.value)].text)} className={`${inputBase} mt-3`}>
                {templates.map((template, index) => <option key={template.name} value={index}>{template.name}</option>)}
              </select>
              <textarea value={noticeText} onChange={(event) => setNoticeText(event.target.value)} rows={4} className={`${inputBase} mt-2`} />
              <textarea value={noticeRecipients} onChange={(event) => setNoticeRecipients(event.target.value)} rows={3} placeholder="Numeros o grupos separados por coma o salto de linea" className={`${inputBase} mt-2`} />
              <label className="mt-2 flex items-center gap-2 rounded-md border border-sky-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700"><ImagePlus className="h-4 w-4" /><input type="file" accept="image/*" onChange={(event) => setNoticeImage(event.target.files?.[0] || null)} /></label>
              <button onClick={sendBroadcast} className="mt-3 w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white">Enviar aviso</button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default OperatorChatPage;
