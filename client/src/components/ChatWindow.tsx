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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
        <p className="text-sm font-medium">Start a conversation...</p>
        <p className="text-xs text-gray-400">Send a message to begin chatting with AI</p>
      </div>
    );
  }

  // Message list
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
