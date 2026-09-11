
import React from 'react';
import ChatHeader from '../components/ChatHeader';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import MessageInput from '../components/MessageInput';
import PhoneInput from '../components/PhoneInput';
import { useChatStore } from '../store/chatStore';

const ChatPage: React.FC = () => {
  const { messages, isTyping } = useChatStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl h-[90vh] flex flex-col overflow-hidden">
        <ChatHeader />
        <PhoneInput />
        
        <div className="flex-1 overflow-y-auto bg-whatsapp-background p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="self-center mt-4">
              <div className="bg-white rounded-2xl p-4 text-sm text-gray-700 shadow-sm">
                ¡Hola! 👋 Soy el asistente virtual del servicio de agua.
                <br />¿En qué puedo ayudarte hoy?
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
        </div>
        
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatPage;
