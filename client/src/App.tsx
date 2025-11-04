import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBox from './components/InputBox';
import LoadingSpinner from './components/LoadingSpinner';
import { Message } from './types/chat';
import { sendMessage } from './services/api';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (content: string) => {
    // Clear any previous errors
    setError(null);

    // Add user message to state
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Set loading state
    setIsLoading(true);

    try {
      // Call API to get assistant response
      const response = await sendMessage(content);

      // Add assistant response to state
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      // Handle API errors with user-friendly messages
      let errorMessage = 'Failed to send message. Please try again.';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="app-container">
      <Header onClearChat={handleClearChat} />

      <div className="chat-container">
        <ChatWindow messages={messages} />

        {error && (
          <div className="error-message" role="alert">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading-indicator">
            <LoadingSpinner size="small" />
            <span className="ml-2 text-sm text-gray-600">AI is typing...</span>
          </div>
        )}
      </div>

      <InputBox onSend={handleSendMessage} loading={isLoading} />

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
        }

        .chat-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        .error-message {
          padding: 16px;
          margin: 12px 16px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 4px solid #dc2626;
          border-radius: 8px;
          animation: slideIn 0.3s ease-out;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          margin: 8px 16px;
          background-color: #f9fafb;
          border-radius: 8px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .error-message {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
