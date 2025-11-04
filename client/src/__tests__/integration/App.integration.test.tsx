/**
 * Integration Tests for App Component with API
 *
 * These tests verify the complete integration between App.tsx and the API service,
 * covering the full message flow from user input to response display.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from '../../App';
import { ChatResponse } from '../../types/api';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock axios instance with post method
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
} as any;

// Mock axios.create to return our mock instance
mockedAxios.create = jest.fn(() => mockAxiosInstance);

// Mock axios.isAxiosError
mockedAxios.isAxiosError = jest.fn((error: any) => {
  return error && error.isAxiosError === true;
});

describe('App Integration Tests - Full Message Flow', () => {
  beforeEach(() => {
    // Reset all mocks but preserve the setup
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    // Mock window.confirm for clear chat tests
    window.confirm = jest.fn(() => true);
  });

  describe('Successful Message Flow', () => {
    it('should complete full flow: user types -> sends -> loading -> response displays', async () => {
      // Mock successful API response
      const mockResponse: ChatResponse = {
        reply: 'This is the assistant response',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      render(<App />);

      // Find input box and send button
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type user message
      fireEvent.change(input, { target: { value: 'Hello, assistant!' } });

      // Verify input shows user text
      expect(input).toHaveValue('Hello, assistant!');

      // Send message
      fireEvent.click(sendButton);

      // Verify user message appears in chat
      expect(await screen.findByText('Hello, assistant!')).toBeInTheDocument();

      // Verify loading indicator shows (input should be disabled)
      expect(input).toBeDisabled();

      // Wait for response to appear
      const response = await screen.findByText('This is the assistant response');
      expect(response).toBeInTheDocument();

      // Verify input is re-enabled after response
      expect(input).toBeEnabled();

      // Verify input is cleared
      expect(input).toHaveValue('');

      // Verify API was called correctly
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/chat',
        { message: 'Hello, assistant!' }
      );
    });

    it('should handle multiple messages in sequence (conversation state)', async () => {
      // Mock two successful responses
      const mockResponse1: ChatResponse = {
        reply: 'First response',
        model: 'test-model',
        provider: 'lmstudio',
      };

      const mockResponse2: ChatResponse = {
        reply: 'Second response',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: mockResponse1,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        })
        .mockResolvedValueOnce({
          data: mockResponse2,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First message
      fireEvent.change(input, { target: { value: 'First message' } });
      fireEvent.click(sendButton);

      // Wait for first response
      await screen.findByText('First response');

      // Verify both user message and response are displayed
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('First response')).toBeInTheDocument();

      // Second message
      fireEvent.change(input, { target: { value: 'Second message' } });
      fireEvent.click(sendButton);

      // Wait for second response
      await screen.findByText('Second response');

      // Verify all four messages are displayed (conversation history)
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('First response')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Second response')).toBeInTheDocument();

      // Verify API was called twice
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling - Network Failures', () => {
    it('should display error message when network is unavailable', async () => {
      // Mock network error (no response)
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: undefined, // No response = network error
        message: 'Network Error',
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send message
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      // User message should appear
      expect(await screen.findByText('Test message')).toBeInTheDocument();

      // Error message should appear
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent(/network error/i);

      // Input should be re-enabled
      expect(input).toBeEnabled();
    });

    it('should display error for 400 Bad Request', async () => {
      // Mock 400 error
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Bad Request', message: 'Message cannot be empty' },
        },
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Error should display
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should display error for 503 Service Unavailable (LMStudio down)', async () => {
      // Mock 503 error
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 503,
          data: {
            error: 'Service Unavailable',
            message: 'LLM provider is not available',
          },
        },
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Error should display
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent(/service temporarily unavailable/i);
    });

    it('should display error for 500 Internal Server Error', async () => {
      // Mock 500 error
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            error: 'Internal Server Error',
            message: 'Failed to process message',
          },
        },
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Error should display
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveTextContent(/server error/i);
    });
  });

  describe('Loading State Management', () => {
    it('should disable input and show loading state during API call', async () => {
      // Mock slow API response
      const mockResponse: ChatResponse = {
        reply: 'Response',
        model: 'test-model',
        provider: 'lmstudio',
      };

      // Create a promise that we can control
      let resolvePromise: any;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockAxiosInstance.post.mockReturnValueOnce(slowPromise as any);

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send message
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Wait for user message to appear
      await screen.findByText('Test');

      // Input should be disabled during loading
      expect(input).toBeDisabled();

      // Resolve the API call
      resolvePromise({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Wait for response
      await screen.findByText('Response');

      // Input should be enabled again
      expect(input).toBeEnabled();
    });
  });

  describe('Error Message Clearing', () => {
    it('should clear error message when sending new message', async () => {
      // First request fails
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Server Error' },
        },
      });

      // Second request succeeds
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          reply: 'Success response',
          model: 'test-model',
          provider: 'lmstudio',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First message (fails)
      fireEvent.change(input, { target: { value: 'First' } });
      fireEvent.click(sendButton);

      // Error appears
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toBeInTheDocument();

      // Second message (succeeds)
      fireEvent.change(input, { target: { value: 'Second' } });
      fireEvent.click(sendButton);

      // Wait for success response
      await screen.findByText('Success response');

      // Error message should be gone
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should clear error message when clearing chat', async () => {
      // Request fails
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Server Error' },
        },
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send message that fails
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Error appears
      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toBeInTheDocument();

      // Click clear chat button
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      // Error message should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('UI Feedback and Auto-scroll', () => {
    it('should display messages in correct order (user then assistant)', async () => {
      const mockResponse: ChatResponse = {
        reply: 'Assistant reply',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send message
      fireEvent.change(input, { target: { value: 'User message' } });
      fireEvent.click(sendButton);

      // Wait for both messages
      await screen.findByText('User message');
      await screen.findByText('Assistant reply');

      // Verify both are in the document
      expect(screen.getByText('User message')).toBeInTheDocument();
      expect(screen.getByText('Assistant reply')).toBeInTheDocument();
    });
  });

  describe('Empty Message Handling', () => {
    it('should not send empty messages', () => {
      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Try to send empty message
      fireEvent.click(sendButton);

      // API should not be called
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only messages', () => {
      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Try to send whitespace
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(sendButton);

      // API should not be called
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });
  });
});
