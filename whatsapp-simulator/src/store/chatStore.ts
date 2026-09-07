
import { create } from 'zustand';
import { Message, Conversation } from '../types';

interface ChatState {
  messages: Message[];
  conversations: Conversation[];
  currentSessionId: string | null;
  phoneNumber: string;
  isTyping: boolean;
  isConnected: boolean;
  
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversations: [],
  currentSessionId: null,
  phoneNumber: '+59170000001',
  isTyping: false,
  isConnected: false,
  
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setConversations: (conversations) => set({ conversations }),
  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setIsConnected: (isConnected) => set({ isConnected }),
  clearMessages: () => set({ messages: [], currentSessionId: null }),
}));
