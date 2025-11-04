import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

// Mock window.confirm
const mockConfirm = jest.spyOn(window, 'confirm');

describe('Header Component', () => {
  beforeEach(() => {
    mockConfirm.mockClear();
  });

  afterAll(() => {
    mockConfirm.mockRestore();
  });

  test('renders app title "AI Chat"', () => {
    render(<Header />);
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
  });

  test('renders clear button when onClearChat prop is provided', () => {
    const mockCallback = jest.fn();
    render(<Header onClearChat={mockCallback} />);
    expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
  });

  test('does not render clear button when onClearChat prop is not provided', () => {
    render(<Header />);
    expect(screen.queryByRole('button', { name: /clear chat/i })).not.toBeInTheDocument();
  });

  test('shows confirmation dialog when clear button is clicked', async () => {
    const mockCallback = jest.fn();
    mockConfirm.mockReturnValue(false);

    render(<Header onClearChat={mockCallback} />);
    const clearButton = screen.getByRole('button', { name: /clear chat/i });

    await userEvent.click(clearButton);

    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to clear the chat history? This action cannot be undone.'
    );
  });

  test('calls onClearChat callback when user confirms', async () => {
    const mockCallback = jest.fn();
    mockConfirm.mockReturnValue(true);

    render(<Header onClearChat={mockCallback} />);
    const clearButton = screen.getByRole('button', { name: /clear chat/i });

    await userEvent.click(clearButton);

    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('does not call onClearChat callback when user cancels', async () => {
    const mockCallback = jest.fn();
    mockConfirm.mockReturnValue(false);

    render(<Header onClearChat={mockCallback} />);
    const clearButton = screen.getByRole('button', { name: /clear chat/i });

    await userEvent.click(clearButton);

    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('header has proper styling classes', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');

    expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    expect(header).toHaveClass('p-5', 'text-white', 'shadow-lg');
    expect(header).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700');
  });

  test('clear button has proper ARIA label for accessibility', () => {
    const mockCallback = jest.fn();
    render(<Header onClearChat={mockCallback} />);

    const clearButton = screen.getByRole('button', { name: 'Clear chat history' });
    expect(clearButton).toHaveAttribute('aria-label', 'Clear chat history');
  });

  test('title has proper heading level', () => {
    render(<Header />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('AI Chat');
  });
});
