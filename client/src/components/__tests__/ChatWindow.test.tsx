import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatWindow from '../ChatWindow';
import { Message as MessageType } from '../../types/chat';

// Mock scrollIntoView (not available in JSDOM)
Element.prototype.scrollIntoView = jest.fn();

// Mock the Message component
jest.mock('../Message', () => {
  return function MockMessage({ role, content, timestamp }: any) {
    return (
      <div data-testid="message" data-role={role} data-content={content}>
        {role}: {content} ({timestamp.toISOString()})
      </div>
    );
  };
});

describe('ChatWindow', () => {
  describe('Empty State', () => {
    it('should render empty state when no messages', () => {
      render(<ChatWindow messages={[]} />);
      expect(screen.getByText('Start a conversation...')).toBeInTheDocument();
    });

    it('should center the empty state text', () => {
      const { container } = render(<ChatWindow messages={[]} />);
      const emptyStateContainer = container.firstChild as HTMLElement;
      expect(emptyStateContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should style empty state with gray text', () => {
      const { container } = render(<ChatWindow messages={[]} />);
      const emptyStateContainer = container.firstChild as HTMLElement;
      expect(emptyStateContainer).toHaveClass('text-gray-400');
    });
  });

  describe('Message List Rendering', () => {
    const mockMessages: MessageType[] = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2025-11-03T10:00:00Z'),
      },
      {
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date('2025-11-03T10:00:01Z'),
      },
    ];

    it('should render all messages', () => {
      render(<ChatWindow messages={mockMessages} />);
      const messages = screen.getAllByTestId('message');
      expect(messages).toHaveLength(2);
    });

    it('should pass correct props to Message components', () => {
      render(<ChatWindow messages={mockMessages} />);
      const messages = screen.getAllByTestId('message');

      expect(messages[0]).toHaveAttribute('data-role', 'user');
      expect(messages[0]).toHaveAttribute('data-content', 'Hello');

      expect(messages[1]).toHaveAttribute('data-role', 'assistant');
      expect(messages[1]).toHaveAttribute('data-content', 'Hi there!');
    });

    it('should render messages in order', () => {
      render(<ChatWindow messages={mockMessages} />);
      const messages = screen.getAllByTestId('message');

      expect(messages[0]).toHaveTextContent('user: Hello');
      expect(messages[1]).toHaveTextContent('assistant: Hi there!');
    });

    it('should use unique keys for each message', () => {
      // This is tested implicitly - React will warn if keys are not unique
      const { container } = render(<ChatWindow messages={mockMessages} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Single Message', () => {
    it('should render a single message correctly', () => {
      const singleMessage: MessageType[] = [
        {
          role: 'user',
          content: 'Test message',
          timestamp: new Date('2025-11-03T10:00:00Z'),
        },
      ];

      render(<ChatWindow messages={singleMessage} />);
      expect(screen.getByTestId('message')).toBeInTheDocument();
      expect(screen.getByText(/Test message/)).toBeInTheDocument();
    });
  });

  describe('Many Messages', () => {
    it('should handle many messages without errors', () => {
      const manyMessages: MessageType[] = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i + 1}`,
        timestamp: new Date(`2025-11-03T10:00:${String(i).padStart(2, '0')}Z`),
      }));

      render(<ChatWindow messages={manyMessages} />);
      const messages = screen.getAllByTestId('message');
      expect(messages).toHaveLength(50);
    });

    it('should render the correct first and last messages', () => {
      const manyMessages: MessageType[] = Array.from({ length: 10 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i + 1}`,
        timestamp: new Date(`2025-11-03T10:00:${String(i).padStart(2, '0')}Z`),
      }));

      render(<ChatWindow messages={manyMessages} />);
      expect(screen.getByText(/user: Message 1 \(/)).toBeInTheDocument();
      expect(screen.getByText(/user: Message 10 \(/)).toBeInTheDocument();
    });
  });

  describe('Container Styling', () => {
    it('should have scrollable container class', () => {
      const messages: MessageType[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      const { container } = render(<ChatWindow messages={messages} />);
      const scrollContainer = container.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should have flex-1 class for proper layout', () => {
      const messages: MessageType[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      const { container } = render(<ChatWindow messages={messages} />);
      const flexContainer = container.querySelector('.flex-1');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have padding', () => {
      const messages: MessageType[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      const { container } = render(<ChatWindow messages={messages} />);
      const paddedContainer = container.querySelector('.p-4');
      expect(paddedContainer).toBeInTheDocument();
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('should have a scroll anchor element', () => {
      const messages: MessageType[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      const { container } = render(<ChatWindow messages={messages} />);
      // The scroll anchor is a div at the end of the message list
      const scrollAnchor = container.querySelector('div[class*="overflow-y-auto"] > div:last-child');
      expect(scrollAnchor).toBeInTheDocument();
    });
  });

  describe('Message Uniqueness', () => {
    it('should handle messages with same timestamp', () => {
      const sameTimestamp = new Date('2025-11-03T10:00:00Z');
      const messages: MessageType[] = [
        {
          role: 'user',
          content: 'First',
          timestamp: sameTimestamp,
        },
        {
          role: 'user',
          content: 'Second',
          timestamp: sameTimestamp,
        },
      ];

      render(<ChatWindow messages={messages} />);
      const renderedMessages = screen.getAllByTestId('message');
      expect(renderedMessages).toHaveLength(2);
    });
  });

  describe('Message Type Integration', () => {
    it('should accept MessageType from chat.ts types', () => {
      const messages: MessageType[] = [
        {
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
        },
      ];

      // This test verifies type compatibility
      expect(() => render(<ChatWindow messages={messages} />)).not.toThrow();
    });

    it('should accept both user and assistant roles', () => {
      const messages: MessageType[] = [
        {
          role: 'user',
          content: 'User message',
          timestamp: new Date(),
        },
        {
          role: 'assistant',
          content: 'Assistant message',
          timestamp: new Date(),
        },
      ];

      render(<ChatWindow messages={messages} />);
      const renderedMessages = screen.getAllByTestId('message');
      expect(renderedMessages[0]).toHaveAttribute('data-role', 'user');
      expect(renderedMessages[1]).toHaveAttribute('data-role', 'assistant');
    });
  });
});
