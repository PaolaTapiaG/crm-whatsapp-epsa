
import React from 'react';
import { useChatStore } from '../store/chatStore';

const PhoneInput: React.FC = () => {
  const { phoneNumber, setPhoneNumber } = useChatStore();

  return (
    <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-t border-gray-200">
      <label className="text-xs text-gray-600 font-medium">Tu número:</label>
      <input
        type="text"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="+59170000000"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
      />
    </div>
  );
};

export default PhoneInput;
