import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBox from './components/InputBox';
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
            {error}
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
          padding: 12px 16px;
          margin: 8px 16px;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 6px;
          color: #c33;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default App;
