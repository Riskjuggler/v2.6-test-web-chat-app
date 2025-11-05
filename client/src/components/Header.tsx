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
    <header className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
          <svg
            className="w-4 h-4 text-blue-600"
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
        <h1 className="text-lg font-bold">AI Chat</h1>
      </div>
      {onClearChat && (
        <button
          onClick={handleClearClick}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
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
