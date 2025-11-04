import React, { useEffect, useRef } from 'react';
import { Message as MessageType } from '../types/chat';
import Message from './Message';

interface ChatWindowProps {
  messages: MessageType[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-lg">
        Start a conversation...
      </div>
    );
  }

  // Message list
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message, index) => (
        <Message
          key={`${message.role}-${message.timestamp.getTime()}-${index}`}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
