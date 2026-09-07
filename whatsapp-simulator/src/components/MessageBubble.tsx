
import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  
  if (isSystem) {
    return (
      <div className="self-center bg-yellow-100 text-gray-600 text-xs px-4 py-2 rounded-lg max-w-[80%]">
        {message.text}
        <span className="block text-right text-[10px] text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  }
  
  return (
    <div
      className={`max-w-[70%] px-4 py-2 rounded-2xl relative animate-fade-in ${
        isUser
          ? 'bg-whatsapp-light self-end rounded-br-md'
          : 'bg-white self-start rounded-bl-md'
      }`}
    >
      <p className="text-sm text-gray-800">{message.text}</p>
      
      {message.intent && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
            {message.intent}
          </span>
          {message.confidence && (
            <span className="text-[10px] text-green-500">
              {Math.round(message.confidence > 1 ? message.confidence : message.confidence * 100)}%
            </span>
          )}
        </div>
      )}
      
      <span className="block text-right text-[10px] text-gray-400 mt-1">
        {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

export default MessageBubble;
