
import React from 'react';
import { useChatStore } from '../store/chatStore';

const ChatHeader: React.FC = () => {
  const { isConnected } = useChatStore();
  
  return (
    <div className="bg-whatsapp-dark text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-whatsapp-green flex items-center justify-center text-xl">
          💧
        </div>
        <div>
          <h2 className="text-lg font-semibold">Servicio de Agua - Bot</h2>
          <p className="text-xs opacity-80">
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            {isConnected ? 'En línea' : 'Desconectado'}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-xs opacity-80">Simulador</div>
        <div className="text-xs opacity-60">
          {isConnected ? '✅ Conectado' : '❌ Sin conexión'}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
