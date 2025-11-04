import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InputBox from './InputBox';

describe('InputBox Component', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  test('renders textarea and send button', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);
    const button = screen.getByRole('button', { name: /send message/i });

    expect(textarea).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  test('typing updates textarea value', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);
    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    expect(textarea).toHaveValue('Hello world');
  });

  test('clicking send button triggers callback with trimmed message', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);
    const button = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(textarea, { target: { value: '  Hello world  ' } });
    fireEvent.click(button);

    expect(mockOnSend).toHaveBeenCalledTimes(1);
    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });

  test('pressing Enter key triggers send', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(mockOnSend).toHaveBeenCalledTimes(1);
    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  test('pressing Shift+Enter does not trigger send', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  test('empty message does not trigger send', () => {
    render(<InputBox onSend={mockOnSend} />);

    const button = screen.getByRole('button', { name: /send message/i });

    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  test('whitespace-only message does not trigger send', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);
    const button = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(textarea, { target: { value: '   ' } });

    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  test('textarea and button are disabled when loading', () => {
    render(<InputBox onSend={mockOnSend} loading={true} />);

    const textarea = screen.getByLabelText(/message input/i);
    const button = screen.getByRole('button', { name: /send message/i });

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Sending...');
  });

  test('input clears after successful send', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);
    const button = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(button);

    expect(textarea).toHaveValue('');
  });

  test('button is disabled when loading even if message is present', () => {
    render(<InputBox onSend={mockOnSend} loading={true} />);

    const button = screen.getByRole('button', { name: /send message/i });

    expect(button).toBeDisabled();
  });

  test('callback receives correct message value', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);
    const button = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(textarea, { target: { value: 'First message' } });
    fireEvent.click(button);

    expect(mockOnSend).toHaveBeenCalledWith('First message');

    fireEvent.change(textarea, { target: { value: 'Second message' } });
    fireEvent.click(button);

    expect(mockOnSend).toHaveBeenCalledWith('Second message');
    expect(mockOnSend).toHaveBeenCalledTimes(2);
  });

  test('button enables when text is typed', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);
    const button = screen.getByRole('button', { name: /send message/i });

    expect(button).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'a' } });

    expect(button).not.toBeDisabled();
  });

  test('Enter key clears input after send', () => {
    render(<InputBox onSend={mockOnSend} />);

    const textarea = screen.getByLabelText(/message input/i);

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(textarea).toHaveValue('');
  });
});
