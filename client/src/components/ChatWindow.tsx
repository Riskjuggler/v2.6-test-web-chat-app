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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-lg font-medium">Start a conversation...</p>
        <p className="text-sm text-gray-400">Send a message to begin chatting with AI</p>
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
