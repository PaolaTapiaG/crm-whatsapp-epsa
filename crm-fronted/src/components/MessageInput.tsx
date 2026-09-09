
import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { api } from '../services/api';
import { Message } from '../types';

const MessageInput: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { 
    phoneNumber, 
    currentSessionId, 
    addMessage, 
    setCurrentSessionId,
    setIsTyping 
  } = useChatStore();

  const handleSendMessage = async () => {
    const messageText = inputMessage.trim();
    
    if (!phoneNumber || !messageText) {
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    
    addMessage(userMessage);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await api.sendMessage(phoneNumber, messageText, currentSessionId || undefined);
      
      if (response.success && response.data) {
        setCurrentSessionId(response.data.session_id);
        
        // Simulate typing delay
        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: response.data!.response,
            timestamp: new Date(),
            intent: response.data!.analysis?.intent,
            confidence: response.data!.analysis?.confidence,
          };
          
          addMessage(botMessage);
          setIsTyping(false);
        }, 500);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'system',
          text: `Error: ${response.error || 'No se pudo obtener respuesta'}`,
          timestamp: new Date(),
        };
        
        addMessage(errorMessage);
        setIsTyping(false);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: `Error de conexión: ${error.message}`,
        timestamp: new Date(),
      };
      
      addMessage(errorMessage);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gray-100 p-4 flex gap-3">
      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Escribe un mensaje..."
        className="flex-1 px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
      />
      <button
        onClick={handleSendMessage}
        className="w-12 h-12 rounded-full bg-whatsapp-green hover:bg-whatsapp-dark transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  );
};

export default MessageInput;
