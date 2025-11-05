import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';

interface HeaderProps {
  onClearChat?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClearChat }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleClearClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (onClearChat) {
      onClearChat();
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <header className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AI Chat</h1>
      </div>
      {onClearChat && (
        <button
          onClick={handleClearClick}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-blue-600"
          aria-label="Clear chat history"
        >
          Clear Chat
        </button>
      )}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Clear Chat History"
        message="Are you sure you want to clear all messages? This action cannot be undone."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </header>
  );
};

export default Header;
