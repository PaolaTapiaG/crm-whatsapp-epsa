export type ChatFilter = 'all' | 'pending' | 'attention' | 'active' | 'closed';
export type MobileView = 'chats' | 'chat' | 'tools';
export type ConversationStatus = 'active' | 'transferred' | 'finished' | 'closed';

export interface Conversation {
  id: number;
  client_id?: number;
  status: ConversationStatus;
  priority: string;
  channel?: string;
  ai_mode?: 'AI_AUTO' | 'AI_ASSIST' | 'HUMAN_TAKEOVER' | 'WAITING_USER' | 'WAITING_INTERNAL';
  assigned_to?: string;
  unread_count?: number;
  tags?: string[];
  updated_at?: string;
  metadata?: { group_name?: string; is_group?: boolean };
  context?: {
    closure_state?: 'none' | 'awaiting_confirmation' | 'closed';
    close_reason?: string;
    waiting_since?: string;
  };
  client?: {
    name?: string;
    whatsapp_number: string;
    address?: string;
    email?: string;
    segment?: string;
    zone?: string;
    verified?: string;
    metadata?: Record<string, string>;
  };
  last_message?: { id?: number; sender?: string; text: string; created_at?: string };
}

export interface Message {
  id: number;
  sender: string;
  sender_type?: 'customer' | 'ai' | 'operator' | 'system';
  text: string;
  content?: string;
  internal?: boolean;
  metadata?: {
    kind?: string;
    media_url?: string;
    payment_status?: string;
    path?: string;
  };
  created_at: string;
}

export interface SidebarCounts {
  all: number;
  pending: number;
  attention: number;
  active: number;
  closed: number;
}

export const quickReplies = [
  'Su pago esta en revision por el operador, espere unos minutos antes de recibir su factura.',
  'Gracias por contactarnos. Un operador revisara su solicitud.',
  'Por favor envie una foto clara del comprobante de pago por QR.',
  'Necesitamos su nombre completo para continuar con el menu de atencion.',
];

export const emojis = ['😀', '👍', '🙏', '💧', '✅', '📄', '💳', '⚠️'];
export const stickers = ['💧', '🚰', '🙏', '✅'];

export const templates = [
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

export const initialInvoice = {
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

export const invoiceLabels: Record<keyof typeof initialInvoice, string> = {
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

export const conversationActivityTime = (conversation: Conversation): number => {
  const activity = conversation.last_message?.created_at || conversation.updated_at;
  const timestamp = activity ? Date.parse(activity) : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const messageDay = (value: string) =>
  new Date(value).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const mockConversations: Conversation[] = [
  {
    id: 101,
    status: 'active',
    priority: 'high',
    channel: 'WhatsApp',
    ai_mode: 'AI_ASSIST',
    assigned_to: 'María',
    unread_count: 2,
    tags: ['Fuga', 'P1'],
    updated_at: new Date().toISOString(),
    client: {
      name: 'Paula González',
      whatsapp_number: '+591 7123 4567',
      address: 'Zona Norte, La Paz',
      email: 'paula.garcia@email.com',
      segment: 'Cliente activo',
      zone: 'Norte',
      verified: 'Socio verificado',
    },
    last_message: {
      id: 501,
      sender: 'user',
      text: 'Hay una fuga grande afuera de mi casa, puedo enviar foto.',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 102,
    status: 'transferred',
    priority: 'normal',
    channel: 'WhatsApp',
    ai_mode: 'HUMAN_TAKEOVER',
    assigned_to: 'Luis',
    unread_count: 1,
    tags: ['Saldo', 'Secretaría'],
    updated_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    client: {
      name: 'Juan Pérez',
      whatsapp_number: '+591 7788 3322',
      address: 'Villa Fátima',
      segment: 'Prospecto',
      zone: 'Este',
    },
    last_message: {
      id: 502,
      sender: 'user',
      text: 'Necesito verificar mi saldo, tengo mi código de socio.',
      created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 103,
    status: 'active',
    priority: 'normal',
    channel: 'WhatsApp',
    ai_mode: 'AI_AUTO',
    assigned_to: 'Carolina',
    unread_count: 3,
    tags: ['Medidor'],
    updated_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    client: {
      name: 'TransLogística S.A.',
      whatsapp_number: '+591 7011 8899',
      address: 'Parque Industrial',
      segment: 'Empresa',
      zone: 'Sur',
    },
    last_message: {
      id: 503,
      sender: 'user',
      text: 'El medidor marca raro desde ayer, adjunto una foto.',
      created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 104,
    status: 'finished',
    priority: 'low',
    channel: 'WhatsApp',
    ai_mode: 'WAITING_USER',
    assigned_to: 'María',
    tags: ['Pago'],
    updated_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    client: {
      name: 'Carolina Méndez',
      whatsapp_number: '+591 7155 6677',
      address: 'San Pedro',
      segment: 'Soporte',
      zone: 'Centro',
    },
    last_message: {
      id: 504,
      sender: 'bot',
      text: 'Recibimos tu comprobante. Secretaría validará el pago.',
      created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export const mockMessages: Record<number, Message[]> = {
  101: [
    {
      id: 1,
      sender: 'user',
      sender_type: 'customer',
      text: 'Hola, hay una fuga grande afuera de mi casa.',
      created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      sender: 'bot',
      sender_type: 'ai',
      text: 'Gracias por avisar. Para crear el ticket necesito una referencia de ubicación y, si puedes, una foto clara de la fuga.',
      created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      sender: 'user',
      sender_type: 'customer',
      text: 'Es en la esquina de la plaza, sale bastante agua.',
      created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      sender: 'human',
      sender_type: 'operator',
      text: 'Ya registré el reporte como prioridad alta. Un técnico revisará la asignación por zona.',
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
  ],
};
