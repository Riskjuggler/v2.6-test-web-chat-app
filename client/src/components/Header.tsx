import React from 'react';

interface HeaderProps {
  onClearChat?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClearChat }) => {
  const handleClearClick = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear the chat history? This action cannot be undone.'
    );

    if (confirmed && onClearChat) {
      onClearChat();
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-blue-600 text-white shadow-md">
      <h1 className="text-2xl font-bold">AI Chat</h1>
      {onClearChat && (
        <button
          onClick={handleClearClick}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors duration-200 font-medium"
          aria-label="Clear chat history"
        >
          Clear Chat
        </button>
      )}
    </header>
  );
};

export default Header;
