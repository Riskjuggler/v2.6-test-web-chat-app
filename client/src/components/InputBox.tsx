import React, { useState, KeyboardEvent, ChangeEvent } from 'react';

interface InputBoxProps {
  onSend: (message: string) => void;
  loading?: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ onSend, loading = false }) => {
  const [message, setMessage] = useState('');

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !loading) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter creates new line (default behavior, no action needed)
  };

  const isDisabled = loading || message.trim().length === 0;

  return (
    <div className="input-box">
      <textarea
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={loading}
        placeholder="Type your message..."
        className="input-box-textarea"
        rows={3}
        aria-label="Message input"
      />
      <button
        onClick={handleSend}
        disabled={isDisabled}
        className="input-box-button"
        aria-label="Send message"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
      <style>{`
        .input-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .input-box-textarea {
          width: 100%;
          padding: 14px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.6;
          resize: vertical;
          min-height: 60px;
          transition: all 0.2s ease;
        }

        .input-box-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }

        .input-box-textarea:hover:not(:disabled) {
          border-color: #cbd5e1;
        }

        .input-box-textarea:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .input-box-button {
          align-self: flex-end;
          padding: 12px 28px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        .input-box-button:hover:not(:disabled) {
          background-color: #2563eb;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
          transform: translateY(-1px);
        }

        .input-box-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(59, 130, 246, 0.3);
        }

        .input-box-button:focus {
          outline: none;
          ring: 2px;
          ring-color: #3b82f6;
          ring-offset: 2px;
        }

        .input-box-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default InputBox;
