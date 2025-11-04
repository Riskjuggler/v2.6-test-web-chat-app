import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Message from './Message';

describe('Message Component', () => {
  const mockTimestamp = new Date('2025-11-03T14:30:45');

  describe('User Messages', () => {
    it('renders user message with correct content', () => {
      render(
        <Message
          role="user"
          content="Hello, assistant!"
          timestamp={mockTimestamp}
        />
      );
      expect(screen.getByText('Hello, assistant!')).toBeInTheDocument();
    });

    it('applies correct styling for user messages', () => {
      const { container } = render(
        <Message
          role="user"
          content="User message"
          timestamp={mockTimestamp}
        />
      );
      const messageDiv = container.querySelector('.bg-blue-500');
      expect(messageDiv).toBeInTheDocument();
      expect(messageDiv).toHaveClass('text-white');
    });

    it('aligns user messages to the right', () => {
      const { container } = render(
        <Message
          role="user"
          content="User message"
          timestamp={mockTimestamp}
        />
      );
      const wrapper = container.querySelector('.justify-end');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Assistant Messages', () => {
    it('renders assistant message with correct content', () => {
      render(
        <Message
          role="assistant"
          content="How can I help you?"
          timestamp={mockTimestamp}
        />
      );
      expect(screen.getByText('How can I help you?')).toBeInTheDocument();
    });

    it('applies correct styling for assistant messages', () => {
      const { container } = render(
        <Message
          role="assistant"
          content="Assistant message"
          timestamp={mockTimestamp}
        />
      );
      const messageDiv = container.querySelector('.bg-gray-300');
      expect(messageDiv).toBeInTheDocument();
      expect(messageDiv).toHaveClass('text-gray-900');
    });

    it('aligns assistant messages to the left', () => {
      const { container } = render(
        <Message
          role="assistant"
          content="Assistant message"
          timestamp={mockTimestamp}
        />
      );
      const wrapper = container.querySelector('.justify-start');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Timestamp Display', () => {
    it('displays formatted timestamp', () => {
      render(
        <Message
          role="user"
          content="Test message"
          timestamp={mockTimestamp}
        />
      );
      expect(screen.getByText('14:30:45')).toBeInTheDocument();
    });

    it('formats single-digit hours with leading zero', () => {
      const earlyTimestamp = new Date('2025-11-03T09:05:03');
      render(
        <Message
          role="user"
          content="Test message"
          timestamp={earlyTimestamp}
        />
      );
      expect(screen.getByText('09:05:03')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles long messages without breaking layout', () => {
      const longMessage = 'This is a very long message that should wrap properly without breaking the layout or extending beyond the maximum width constraints set by Tailwind CSS classes.';
      const { container } = render(
        <Message
          role="user"
          content={longMessage}
          timestamp={mockTimestamp}
        />
      );
      expect(screen.getByText(longMessage)).toBeInTheDocument();
      const messageDiv = container.querySelector('.break-words');
      expect(messageDiv).toBeInTheDocument();
    });

    it('handles empty content', () => {
      render(
        <Message
          role="user"
          content=""
          timestamp={mockTimestamp}
        />
      );
      // Component should still render even with empty content
      expect(screen.getByText('14:30:45')).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialChars = 'Hello! @#$%^&*() <>"\'';
      render(
        <Message
          role="assistant"
          content={specialChars}
          timestamp={mockTimestamp}
        />
      );
      expect(screen.getByText(specialChars)).toBeInTheDocument();
    });

    it('handles multiline content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      render(
        <Message
          role="user"
          content={multilineContent}
          timestamp={mockTimestamp}
        />
      );
      // Check that the content is present, even if rendered with whitespace normalization
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive max-width classes', () => {
      const { container } = render(
        <Message
          role="user"
          content="Test message"
          timestamp={mockTimestamp}
        />
      );
      const messageDiv = container.querySelector('.max-w-xs');
      expect(messageDiv).toBeInTheDocument();
      expect(messageDiv).toHaveClass('md:max-w-md', 'lg:max-w-lg');
    });

    it('applies responsive text size classes', () => {
      const { container } = render(
        <Message
          role="user"
          content="Test message"
          timestamp={mockTimestamp}
        />
      );
      const contentParagraph = container.querySelector('p.text-sm');
      expect(contentParagraph).toBeInTheDocument();
      expect(contentParagraph).toHaveClass('md:text-base');
    });
  });
});
