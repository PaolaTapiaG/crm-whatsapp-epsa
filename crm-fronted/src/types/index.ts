
export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  intent?: string;
  sentiment?: number;
  confidence?: number;
}

export interface Conversation {
  phoneNumber: string;
  sessionId: string;
  lastMessage: string;
  lastResponse: string;
  timestamp: Date;
  messages: Message[];
}

export interface ApiResponse {
  success: boolean;
  data?: {
    conversation_id: number;
    message_id: number;
    response: string;
    session_id: string;
    analysis?: {
      intent: string;
      confidence: number;
      sentiment: number;
      requires_action: string;
    };
  };
  error?: string;
}

export interface HealthStatus {
  success: boolean;
  backend: 'connected' | 'disconnected';
  data?: any;
}

export interface DashboardStats {
  total_clients: number;
  active_clients: number;
  new_clients_today: number;
  total_conversations: number;
  active_conversations: number;
  conversations_today: number;
  total_messages: number;
  messages_today: number;
  messages_week: number;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  urgent_tickets: number;
  total_intents: number;
  active_intents: number;
  total_meters?: number;
  active_meters?: number;
  pending_bills?: number;
  outstanding_amount?: number;
}

export interface DashboardMessage {
  id: number;
  sender: string;
  text: string;
  intent: string | null;
  confidence: number | null;
  client_name: string;
  whatsapp_number: string;
  created_at: string | null;
}

export interface DashboardIntent {
  intent: string;
  count: number;
}

export interface DashboardIaStatus {
  provider_status: 'connected' | 'disconnected' | 'disabled';
  ollama_status: 'connected' | 'disconnected';
  ia_provider: string;
  total_messages_analyzed: number;
  average_confidence: number;
}
