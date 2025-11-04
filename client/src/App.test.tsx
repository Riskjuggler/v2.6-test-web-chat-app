import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { sendMessage } from './services/api';

// Mock the API service
jest.mock('./services/api');
const mockSendMessage = sendMessage as jest.MockedFunction<typeof sendMessage>;

describe('App Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders all main components', () => {
      render(<App />);

      // Header should be present
      expect(screen.getByText('AI Chat')).toBeInTheDocument();

      // ChatWindow empty state should be present
      expect(screen.getByText('Start a conversation...')).toBeInTheDocument();

      // InputBox should be present
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();

      // Clear Chat button should be present
      expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
    });

    it('renders with proper layout structure', () => {
      const { container } = render(<App />);
      const appContainer = container.querySelector('.app-container');
      expect(appContainer).toBeInTheDocument();
      expect(appContainer).toHaveStyle({ display: 'flex', flexDirection: 'column' });
    });
  });

  describe('Message Sending', () => {
    it('adds user message to state when sent', async () => {
      mockSendMessage.mockResolvedValue({
        reply: 'Assistant response',
        model: 'test',
        provider: 'test',
      });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Type and send a message
      await userEvent.type(input, 'Hello, AI!');
      fireEvent.click(sendButton);

      // User message should appear
      await waitFor(() => {
        expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
      });
    });

    it('displays assistant response after API call', async () => {
      mockSendMessage.mockResolvedValue({
        reply: 'Hello, human!',
        model: 'test',
        provider: 'test',
      });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Hello, AI!');
      fireEvent.click(sendButton);

      // Wait for assistant response
      await waitFor(() => {
        expect(screen.getByText('Hello, human!')).toBeInTheDocument();
      });
    });

    it('clears input after sending message', async () => {
      mockSendMessage.mockResolvedValue({ reply: 'Response', model: 'test', provider: 'test' });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test message');
      fireEvent.click(sendButton);

      // Input should be cleared
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('calls sendMessage API with correct payload', async () => {
      mockSendMessage.mockResolvedValue({ reply: 'Response', model: 'test', provider: 'test' });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test message');
      fireEvent.click(sendButton);

      // API should be called with the message
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('Test message');
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state while API call is in progress', async () => {
      // Create a promise we control
      let resolveMessage: (value: any) => void;
      const messagePromise = new Promise((resolve) => {
        resolveMessage = resolve;
      });
      mockSendMessage.mockReturnValue(messagePromise as any);

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);

      // Loading state should be shown
      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveMessage!({ reply: 'Response', model: 'test', provider: 'test' });
    });

    it('disables input while loading', async () => {
      let resolveMessage: (value: any) => void;
      const messagePromise = new Promise((resolve) => {
        resolveMessage = resolve;
      });
      mockSendMessage.mockReturnValue(messagePromise as any);

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);

      // Input should be disabled while loading
      await waitFor(() => {
        expect(input).toBeDisabled();
        expect(sendButton).toBeDisabled();
      });

      // Resolve the promise
      resolveMessage!({ reply: 'Response', model: 'test', provider: 'test' });
    });

    it('re-enables input after message is sent', async () => {
      mockSendMessage.mockResolvedValue({ reply: 'Response', model: 'test', provider: 'test' });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);

      // Wait for response and check input is enabled again
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const error = new Error('Network error');
      mockSendMessage.mockRejectedValue(error);

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('displays generic error message for unknown errors', async () => {
      mockSendMessage.mockRejectedValue('Unknown error');

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);

      // Generic error message should be displayed
      await waitFor(() => {
        expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
      });
    });

    it('clears error message when sending new message', async () => {
      // First call fails
      mockSendMessage.mockRejectedValueOnce(new Error('First error'));
      // Second call succeeds
      mockSendMessage.mockResolvedValueOnce({ reply: 'Success', model: 'test', provider: 'test' });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // First message fails
      await userEvent.type(input, 'First');
      fireEvent.click(sendButton);
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second message should clear error
      await userEvent.type(input, 'Second');
      fireEvent.click(sendButton);
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('re-enables input after error', async () => {
      mockSendMessage.mockRejectedValue(new Error('Error'));

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);

      // After error, input should be enabled
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('Clear Chat', () => {
    it('clears all messages when confirmed', async () => {
      mockSendMessage.mockResolvedValue({ reply: 'Response', model: 'test', provider: 'test' });
      window.confirm = jest.fn(() => true);

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send a message
      await userEvent.type(input, 'Test message');
      fireEvent.click(sendButton);
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Clear chat
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      // Messages should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
        expect(screen.getByText('Start a conversation...')).toBeInTheDocument();
      });
    });

    it('does not clear messages when cancelled', async () => {
      mockSendMessage.mockResolvedValue({ reply: 'Response', model: 'test', provider: 'test' });
      window.confirm = jest.fn(() => false);

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send a message
      await userEvent.type(input, 'Test message');
      fireEvent.click(sendButton);
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Try to clear chat but cancel
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      // Messages should still be there
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('clears error message when clearing chat', async () => {
      mockSendMessage.mockRejectedValue(new Error('Test error'));
      window.confirm = jest.fn(() => true);

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send message that fails
      await userEvent.type(input, 'Test');
      fireEvent.click(sendButton);
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Clear chat
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    it('displays multiple messages in order', async () => {
      mockSendMessage
        .mockResolvedValueOnce({ reply: 'First response', model: 'test', provider: 'test' })
        .mockResolvedValueOnce({ reply: 'Second response', model: 'test', provider: 'test' });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Send first message
      await userEvent.type(input, 'First message');
      fireEvent.click(sendButton);
      await waitFor(() => {
        expect(screen.getByText('First response')).toBeInTheDocument();
      });

      // Send second message
      await userEvent.type(input, 'Second message');
      fireEvent.click(sendButton);
      await waitFor(() => {
        expect(screen.getByText('Second response')).toBeInTheDocument();
      });

      // All messages should be visible
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('First response')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Second response')).toBeInTheDocument();
    });

    it('shows empty state when no messages', () => {
      render(<App />);
      expect(screen.getByText('Start a conversation...')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('sends message on Enter key', async () => {
      mockSendMessage.mockResolvedValue({ reply: 'Response', model: 'test', provider: 'test' });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');

      // Type and press Enter
      await userEvent.type(input, 'Test message{Enter}');

      // Message should be sent
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('Test message');
      });
    });

    it('does not send message on Shift+Enter', async () => {
      mockSendMessage.mockResolvedValue({ reply: 'Response', model: 'test', provider: 'test' });

      render(<App />);
      const input = screen.getByPlaceholderText('Type your message...');

      // Type and press Shift+Enter (should create new line, not send)
      await userEvent.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      // API should not be called
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });
});
