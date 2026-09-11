
import axios from 'axios';
import { ApiResponse, DashboardIaStatus, DashboardIntent, DashboardMessage, DashboardStats, HealthStatus } from '../types';
import { API_BASE_URL } from '../config/api';

const configuredApiUrl = String(import.meta.env.VITE_LARAVEL_URL || '').trim().replace(/\/$/, '');
const V1_URL = import.meta.env.PROD
  ? API_BASE_URL
  : configuredApiUrl
    ? `${configuredApiUrl}/api/v1`
    : API_BASE_URL;
axios.defaults.timeout = 30000;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function requestWithRetry<T>(request: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await wait(1500 * (attempt + 1));
    }
  }
  throw lastError;
}

export const api = {
  async sendMessage(phoneNumber: string, message: string, sessionId?: string): Promise<ApiResponse> {
    try {
      const response = await axios.post(`${V1_URL}/whatsapp/webhook`, {
        from: phoneNumber,
        text: message,
        session_id: sessionId || `wa-${phoneNumber}`
      });
      return { success: true, data: response.data.data ?? response.data };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message || 'Error sending message'
      };
    }
  },

  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await requestWithRetry(() => axios.get(`${V1_URL}/whatsapp/status`));
      return { success: Boolean(response.data?.success), backend: 'connected', data: response.data };
    } catch (error: any) {
      return {
        success: false,
        backend: 'disconnected',
        data: { error: error.message }
      };
    }
  },

  async updateWhatsAppProfile(profile: { about: string; address: string; description: string; website?: string }, photo?: File) {
    const form = new FormData();
    form.append('about', profile.about);
    form.append('address', profile.address);
    form.append('description', profile.description);
    if (profile.website) form.append('website', profile.website);
    if (photo) form.append('photo', photo);
    const response = await axios.post(`${V1_URL}/whatsapp/business-profile`, form);
    return response.data;
  },

  async getWhatsAppProfile() {
    const response = await axios.get(`${V1_URL}/whatsapp/business-profile`);
    return response.data?.data ?? response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/dashboard/stats`));
    return response.data.data;
  },

  async getRecentDashboardMessages(limit = 12): Promise<DashboardMessage[]> {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/dashboard/recent-messages`, { params: { limit } }));
    return response.data.data;
  },

  async getTopIntents(): Promise<DashboardIntent[]> {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/dashboard/top-intents`));
    return response.data.data;
  },

  async getIaStatus(): Promise<DashboardIaStatus> {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/dashboard/ia-status`));
    return response.data.data;
  },

  async getAdminResource(resource: 'clients' | 'conversations' | 'tickets', params: Record<string, string | number> = {}) {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/${resource}`, { params }));
    return response.data.data;
  },

  async getAdminIntents() {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/intents`, { params: { per_page: 100 } }));
    return response.data.data;
  },

  async getConversationMessages(id: string) {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/conversations/${id}/messages`));
    return response.data.data;
  },

  async updateConversationStatus(id: string, status: 'active' | 'transferred' | 'finished') {
    const response = await axios.patch(`${V1_URL}/conversations/${id}/status`, { status });
    return response.data;
  },

  async deleteConversation(id: string) {
    const response = await axios.delete(`${V1_URL}/conversations/${id}`);
    return response.data;
  },

  async getOperatorConversations() {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/operator/pending`));
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  async getOperatorMessages(id: string) {
    const response = await requestWithRetry(() => axios.get(`${V1_URL}/operator/conversation/${id}/messages`));
    return {
      ...response.data,
      data: Array.isArray(response.data?.data) ? response.data.data : [],
    };
  },

  async sendOperatorMessage(payload: { to: string; text: string; conversation_id: number }) {
    const response = await axios.post(`${V1_URL}/operator/send-message`, payload);
    return response.data;
  },

  async sendQr(conversationId: number, to: string, file: File) {
    const form = new FormData();
    form.append('to', to); form.append('qr', file);
    const response = await axios.post(`${V1_URL}/operator/conversation/${conversationId}/qr`, form);
    return response.data;
  },

  async reviewPayment(messageId: number, status: 'approved' | 'rejected') {
    const response = await axios.patch(`${V1_URL}/operator/payment/${messageId}`, { status });
    return response.data;
  },

  async sendInvoice(conversationId: number, payload: Record<string, string>) {
    const response = await axios.post(`${V1_URL}/operator/conversation/${conversationId}/invoice`, payload);
    return response.data;
  },

  async sendLocation(conversationId: number, payload: { to: string; latitude: string; longitude: string; name: string; address: string }) {
    const response = await axios.post(`${V1_URL}/operator/conversation/${conversationId}/location`, payload);
    return response.data;
  },

  async sendBroadcast(payload: { recipients: string[]; text: string; image?: File | null }) {
    const form = new FormData();
    payload.recipients.forEach((recipient) => form.append('recipients[]', recipient));
    form.append('text', payload.text);
    if (payload.image) form.append('image', payload.image);
    const response = await axios.post(`${V1_URL}/operator/broadcast`, form);
    return response.data;
  }
};
