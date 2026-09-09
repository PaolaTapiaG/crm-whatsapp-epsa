
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="self-start bg-white px-4 py-3 rounded-2xl rounded-bl-md animate-fade-in">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-gray-400 animate-typing"
            style={{ animationDelay: `${index * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
