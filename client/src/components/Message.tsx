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
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg break-words ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-900'
        }`}
      >
        <p className="text-sm md:text-base">{content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-600'}`}>
          {formatTimestamp(timestamp)}
        </p>
      </div>
    </div>
  );
};

export default Message;
