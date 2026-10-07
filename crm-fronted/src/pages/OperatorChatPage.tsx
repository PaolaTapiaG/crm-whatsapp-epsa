import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, ChevronDown, Menu, Plus, Search } from 'lucide-react';
import AdminSidebar, {
  SIDEBAR_WIDTH_COMPACT,
  SIDEBAR_WIDTH_EXPANDED,
} from '../components/AdminSidebar';
import { ConversationList, MessageList } from '../components/chat/ConversationList';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatComposer } from '../components/chat/ChatComposer';
import { AttachmentsPopover } from '../components/chat/AttachmentsPopover';
import { ClientPanel } from '../components/chat/ClientPanel';
import { MobileLayout } from '../components/chat/MobileLayout';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { useTheme } from '../hooks/useTheme';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { api } from '../services/api';
import { notifyOperator, requestNotificationPermission } from '../lib/notifyOperator';
import { readStored, writeStored } from '../lib/storage';
import {
  conversationActivityTime,
  initialInvoice,
  type ChatFilter,
  type Conversation,
  type MobileView,
} from '../lib/constants';

type AttachmentAction = 'menu' | 'broadcast' | 'invoice' | 'quick' | 'photo' | 'qr';

interface CompanyLocation {
  latitude: string;
  longitude: string;
  name: string;
  address: string;
}

const OperatorChatPage: React.FC = () => {
  /* ------------------------------------------------------------------ */
  /* Tema                                                                */
  /* ------------------------------------------------------------------ */
  useTheme();

  /* ------------------------------------------------------------------ */
  /* Layout                                                              */
  /* ------------------------------------------------------------------ */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('water-crm-sidebar') === 'collapsed'
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showClientPanel, setShowClientPanel] = useState(
    () => window.innerWidth >= 1280
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setShowClientPanel(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem('water-crm-sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  /* ------------------------------------------------------------------ */
  /* Notificaciones                                                      */
  /* ------------------------------------------------------------------ */
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('water-crm-sound') !== 'off'
  );

  const toggleSound = () => {
    setSoundEnabled((current) => {
      const next = !current;
      localStorage.setItem('water-crm-sound', next ? 'on' : 'off');
      return next;
    });
  };

  const enableNotifications = async () => {
    setSoundEnabled(true);
    localStorage.setItem('water-crm-sound', 'on');
    const permission = await requestNotificationPermission();
    if (permission === 'granted' || permission === 'unsupported') {
      notifyOperator(
        'Notificaciones activadas',
        'El CRM avisará cuando llegue un mensaje nuevo.',
        { enabled: true }
      );
      setNotice('Notificaciones activadas para nuevos mensajes.');
    } else {
      setNotice('El navegador bloqueó las notificaciones. Revisa los permisos del sitio.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* Datos: conversaciones y mensajes                                    */
  /* ------------------------------------------------------------------ */
  const {
    conversations,
    active,
    setActive,
    counts,
    reload: reloadConversations,
  } = useConversations({
    onNewMessage: (conversation) => {
      notifyOperator(
        'Nuevo mensaje recibido',
        `${conversation.client?.name || 'Cliente'}: ${
          conversation.last_message?.text?.slice(0, 80) || ''
        }`,
        { enabled: soundEnabled, tag: `conv-${conversation.id}` }
      );
    },
  });

  const {
    messages,
    reload: reloadMessages,
  } = useMessages(active?.id);

  /* ------------------------------------------------------------------ */
  /* Estado de UI                                                        */
  /* ------------------------------------------------------------------ */
  const [mobileView, setMobileView] = useState<MobileView>('chats');
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachmentAction, setAttachmentAction] = useState<AttachmentAction>('menu');
  const [invoice, setInvoice] = useState(initialInvoice);
  const [notice, setNotice] = useState('');
  const [quota, setQuota] = useState<any>(null);

  const [location] = useState<CompanyLocation>(() =>
    readStored('water-crm-company-location', {
      latitude: '-17.3895',
      longitude: '-66.1568',
      name: 'EPSA El Portillo',
      address: 'Oficina central de atencion',
    })
  );

  useEffect(() => {
    writeStored('water-crm-company-location', location);
  }, [location]);

  useEffect(() => {
    let active = true;
    const loadQuota = async () => {
      try {
        const next = await api.getWhatsAppQuota();
        if (active) setQuota(next);
      } catch {
        if (active) setQuota(null);
      }
    };
    loadQuota();
    const timer = window.setInterval(loadQuota, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Efectos sobre la conversación activa                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!active) return;
    setInvoice((current) => ({
      ...current,
      user_name: active.client?.name || current.user_name,
    }));
  }, [active?.id]);

  /* ------------------------------------------------------------------ */
  /* Filtrado de conversaciones                                          */
  /* ------------------------------------------------------------------ */
  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations
      .filter((conversation) => {
        const haystack = `${conversation.client?.name || ''} ${
          conversation.client?.whatsapp_number || ''
        } ${conversation.metadata?.group_name || ''}`.toLowerCase();
        const matchesQuery = !normalized || haystack.includes(normalized);
        const matchesFilter =
          filter === 'all' ||
          (filter === 'pending' && conversation.status === 'transferred') ||
          (filter === 'attention' &&
            conversation.priority === 'high' &&
            conversation.status === 'active') ||
          (filter === 'active' && conversation.status === 'active') ||
          (filter === 'closed' &&
            ['closed', 'finished'].includes(conversation.status));
        return matchesQuery && matchesFilter;
      })
      .sort(
        (left, right) =>
          conversationActivityTime(right) - conversationActivityTime(left)
      );
  }, [conversations, filter, query]);

  /* ------------------------------------------------------------------ */
  /* Acciones                                                            */
  /* ------------------------------------------------------------------ */
  const handleSelect = (conversation: Conversation) => {
    setActive(conversation);
    setMobileView('chat');
  };

  const sendText = async (content = text) => {
    if (!active || !content.trim()) return;
    try {
      await api.sendOperatorMessage({
        to: active.client?.whatsapp_number || '',
        text: content,
        conversation_id: active.id,
      });
      setText('');
      await reloadMessages();
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || 'No se pudo enviar el mensaje.');
    }
  };

  const sendAttachment = async (file: File) => {
    if (!active) return;
    try {
      await api.sendAttachment(active.id, active.client?.whatsapp_number || '', file);
      setNotice('Archivo enviado correctamente.');
      await reloadMessages();
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || 'No se pudo enviar el archivo.');
    }
  };

  const sendInvoice = async () => {
    if (!active || !invoice.bill_number) return;
    const calculatedAmount = [
      invoice.basic_rate,
      invoice.tier_11_15,
      invoice.tier_16_20,
      invoice.tier_20_30,
    ]
      .map((value) => Number(value) || 0)
      .reduce((total, value) => total + value, 0);
    const amount =
      invoice.amount || (calculatedAmount ? calculatedAmount.toFixed(2) : '');
    if (!amount) return;
    try {
      await api.sendInvoice(active.id, {
        to: active.client?.whatsapp_number || '',
        ...invoice,
        amount,
      });
      setNotice('Factura PDF enviada correctamente.');
      await reloadMessages();
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || 'No se pudo enviar la factura.');
    }
  };

  const { recording, start: startRecording, stop: stopRecording } = useVoiceRecorder(
    async (audio) => {
      if (!active) return;
      try {
        await api.sendVoice(active.id, active.client?.whatsapp_number || '', audio);
        await reloadMessages();
      } catch (error: any) {
        setNotice(error?.response?.data?.error || error?.message || 'No se pudo enviar el audio.');
      }
    },
    (message) => setNotice(message)
  );

  const requestClose = async () => {
    if (!active) return;
    try {
      await api.requestConversationClose(active.id);
      setActive((current) =>
        current
          ? {
              ...current,
              status: 'active',
              context: { ...current.context, closure_state: 'awaiting_confirmation' },
            }
          : current
      );
      setNotice('Se pidió confirmación de cierre al cliente.');
      await reloadMessages();
      await reloadConversations();
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || 'No se pudo solicitar el cierre.');
    }
  };

  const changeStatus = async (status: 'active' | 'transferred' | 'finished') => {
    if (!active) return;
    try {
      await api.updateConversationStatus(String(active.id), status);
      setActive((current) => (current ? { ...current, status } : current));
      await reloadConversations();
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || 'No se pudo cambiar el estado.');
    }
  };

  const saveInternalNote = async (note: string) => {
    if (!active || !note.trim()) return;
    try {
      await api.addInternalNote(active.id, note);
      setText('');
      await reloadMessages();
    } catch (error: any) {
      setNotice(error?.response?.data?.error || error?.message || 'No se pudo guardar la nota.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  const desktopPadding = isMobile
    ? undefined
    : sidebarCollapsed
    ? SIDEBAR_WIDTH_COMPACT
    : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="crm-workspace min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        counts={counts}
        operator={{ name: 'Camila R.', role: 'Operador', status: 'online' }}
      />

      {isMobile ? (
        <MobileLayout
          mobileView={mobileView}
          setMobileView={setMobileView}
          active={active}
          filteredConversations={filteredConversations}
          onSelect={handleSelect}
          messages={messages}
          text={text}
          setText={setText}
          onSend={() => sendText()}
          onAttachment={sendAttachment}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          chatSearch={chatSearch}
          setChatSearch={setChatSearch}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          onEnableNotifications={enableNotifications}
          onRequestClose={requestClose}
          onChangeStatus={changeStatus}
          onInternalNote={saveInternalNote}
          onOpenMenu={() => setMobileSidebarOpen(true)}
        />
      ) : (
        <main
          className="min-h-screen bg-[var(--color-background)] px-3 py-3 transition-all duration-200 md:px-4"
          style={{ paddingLeft: desktopPadding }}
        >
          <div className="mx-auto max-w-[1540px]">
            <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] md:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Abrir menú"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="relative hidden min-w-[340px] md:block lg:min-w-[520px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por nombre, teléfono o mensaje..."
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="hidden items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(22,199,102,0.25)] lg:flex">
                  <Plus className="h-4 w-4" />
                  Nueva conversación
                </button>
                <button
                  title="Activar notificaciones"
                  onClick={enableNotifications}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
                </button>
                <button className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-left">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-black text-[var(--color-primary)]">MG</span>
                  <span className="hidden leading-tight md:block">
                    <span className="block text-sm font-bold text-[var(--color-text)]">María García</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">Administradora</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              </div>
            </header>

            {notice && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-text)]">
                <span>{notice}</span>
                <button
                  type="button"
                  onClick={() => setNotice('')}
                  className="text-xs font-semibold text-[var(--color-primary)]"
                >
                  Cerrar
                </button>
              </div>
            )}

            {quota && quota.status !== 'ok' && (
              <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                quota.status === 'exceeded'
                  ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-text)]'
                  : quota.status === 'critical'
                    ? 'border-[var(--color-warning)] bg-[var(--color-warning)]/10 text-[var(--color-text)]'
                    : 'border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-text)]'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <AlertTriangle className={`mt-0.5 h-5 w-5 ${quota.status === 'exceeded' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`} />
                    <div>
                      <p className="font-black">
                        {quota.status === 'exceeded'
                          ? 'Cuota mensual de WhatsApp superada'
                          : quota.status === 'critical'
                            ? 'Cuota de WhatsApp en nivel critico'
                            : 'Cuota de WhatsApp cerca del limite'}
                      </p>
                      <p className="mt-1 text-[var(--color-text-muted)]">
                        Uso estimado: {quota.used} de {quota.limit} mensajes salientes este mes ({quota.percent}%).
                        {quota.status === 'exceeded' ? ' Se bloquearan respuestas automaticas para evitar cargos no planificados.' : ` Restantes: ${quota.remaining}.`}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--color-background)] px-3 py-1 text-xs font-black text-[var(--color-text)]">
                    Reinicia {quota.period_end}
                  </span>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
              <div
                className={`grid min-h-[calc(100vh-112px)] ${
                  showClientPanel
                    ? 'grid-cols-[minmax(0,380px)_minmax(0,1fr)_320px]'
                    : 'grid-cols-[minmax(0,380px)_minmax(0,1fr)]'
                }`}
              >
                <ConversationList
                  conversations={filteredConversations}
                  activeId={active?.id}
                  onSelect={handleSelect}
                  query={query}
                  setQuery={setQuery}
                  filter={filter}
                  setFilter={setFilter}
                  counts={counts}
                />

                <section className="flex flex-col bg-[var(--color-chat)]">
                  {active ? (
                    <>
                      <ChatHeader
                        conversation={active}
                        onToggleClientPanel={() => setShowClientPanel((current) => !current)}
                        onToggleSearch={() => setSearchOpen((current) => !current)}
                      />

                      {searchOpen && (
                        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
                          <input
                            autoFocus
                            value={chatSearch}
                            onChange={(event) => setChatSearch(event.target.value)}
                            placeholder="Buscar en el chat"
                            className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-sky-500"
                          />
                        </div>
                      )}

                      <MessageList
                        messages={messages}
                        conversationId={active.id}
                        searchQuery={chatSearch}
                      />

                      <div className="relative">
                        <ChatComposer
                          text={text}
                          setText={setText}
                          onSend={() => sendText()}
                          onAttachment={sendAttachment}
                          onToggleAttachments={() => {
                            setAttachmentAction('menu');
                            setAttachmentsOpen((current) => !current);
                          }}
                          onOpenInvoice={() => {
                            setAttachmentAction('invoice');
                            setAttachmentsOpen(true);
                          }}
                          onStartRecording={startRecording}
                          onStopRecording={stopRecording}
                          recording={recording}
                        />

                        {attachmentsOpen && (
                          <AttachmentsPopover
                            action={attachmentAction}
                            setAction={setAttachmentAction}
                            onClose={() => setAttachmentsOpen(false)}
                            active={active}
                            invoice={invoice}
                            setInvoice={setInvoice}
                            onSendInvoice={sendInvoice}
                            onNotice={setNotice}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
                      Selecciona un chat para ver el historial.
                    </div>
                  )}
                </section>

                {showClientPanel && active && (
                  <ClientPanel
                    conversation={active}
                    onClose={() => setShowClientPanel(false)}
                    onRequestClose={requestClose}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default OperatorChatPage;
