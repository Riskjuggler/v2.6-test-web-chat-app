import React from 'react';
import { Message as MessageType } from '../types/chat';

interface MessageProps {
  role: MessageType['role'];
  content: string;
  timestamp: Date;
}

const Message: React.FC<MessageProps> = ({ role, content, timestamp }) => {
  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const isUser = role === 'user';

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'} message-fade-in`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg break-words shadow-md transition-all duration-200 hover:shadow-lg ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
        }`}
      >
        <p className="text-sm md:text-base leading-relaxed">{content}</p>
        <p className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-600'}`}>
          {formatTimestamp(timestamp)}
        </p>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-fade-in {
          animation: fadeInUp 0.3s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .message-fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Message;
