/**
 * Frontend Edge Case Tests
 *
 * These tests verify high-risk frontend edge cases from Test Plan Section 5:
 * - Security: XSS protection
 * - UI Stability: Long messages, long responses
 * - Special Characters: Unicode, emojis, quotes, newlines
 * - User Interactions: Rapid clicking, clearing during request, page refresh
 */

// Mock axios BEFORE any imports that use it
jest.mock('axios');

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios, { mockAxiosInstance } from '../../__mocks__/axios';
import App from '../../App';
import { ChatResponse } from '../../types/api';

describe('Frontend Edge Cases - Security', () => {
  beforeEach(() => {
    // Reset all mocks but preserve the setup
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.put.mockReset();
    mockAxiosInstance.delete.mockReset();
    mockAxiosInstance.patch.mockReset();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    cleanup();
  });

  describe('EDGE-014: XSS Protection', () => {
    it('should render script tags as text, not execute them', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const mockResponse: ChatResponse = {
        reply: xssPayload,
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send message that will return XSS payload
      fireEvent.change(input, { target: { value: 'Test XSS' } });
      fireEvent.click(sendButton);

      // Wait for user message to appear first
      await screen.findByText('Test XSS');

      // Wait for response (use regex for flexibility)
      await waitFor(() => {
        expect(screen.getByText(/<script>/)).toBeInTheDocument();
      });

      // Verify the XSS payload is in the document as text
      expect(screen.getByText(/alert\("xss"\)/)).toBeInTheDocument();

      // Verify no actual script elements were created (React should escape it)
      const scripts = document.querySelectorAll('script');
      const xssScripts = Array.from(scripts).filter((script) =>
        script.textContent?.includes('alert("xss")')
      );
      expect(xssScripts.length).toBe(0);
    });

    it('should render img onerror XSS attempts as text', async () => {
      const xssPayload = '<img src=x onerror="alert(1)">';
      const mockResponse: ChatResponse = {
        reply: xssPayload,
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(xssPayload)).toBeInTheDocument();
      });

      // Verify content is rendered as text, not as an actual img element
      const imgs = document.querySelectorAll('img');
      const xssImgs = Array.from(imgs).filter((img) =>
        img.getAttribute('onerror')?.includes('alert')
      );
      expect(xssImgs.length).toBe(0);
    });
  });

  describe('EDGE-012: Special Characters', () => {
    it('should handle quotes and apostrophes correctly', async () => {
      const messageWithQuotes = 'Test "double quotes" and \'single quotes\'';
      const mockResponse: ChatResponse = {
        reply: 'Response with "quotes" and \'apostrophes\'',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: messageWithQuotes } });
      fireEvent.click(sendButton);

      // Verify user message displays correctly
      expect(await screen.findByText(messageWithQuotes)).toBeInTheDocument();

      // Verify response displays correctly
      expect(
        await screen.findByText('Response with "quotes" and \'apostrophes\'')
      ).toBeInTheDocument();
    });

    it('should handle newlines in messages', async () => {
      const messageWithNewlines = 'Line 1\nLine 2\nLine 3';
      const mockResponse: ChatResponse = {
        reply: 'Response line 1\nResponse line 2',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: messageWithNewlines } });
      fireEvent.click(sendButton);

      // Verify messages appear (checking for part of the content)
      await waitFor(() => {
        expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      });
    });

    it('should handle unicode and emojis correctly', async () => {
      const unicodeMessage = 'Hello 👋 مرحبا 你好 こんにちは 😀😁😂';
      const mockResponse: ChatResponse = {
        reply: 'Unicode response: 🎉 мир ¡Hola!',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: unicodeMessage } });
      fireEvent.click(sendButton);

      // Verify unicode message displays
      expect(await screen.findByText(/Hello 👋/)).toBeInTheDocument();

      // Verify unicode response displays
      expect(await screen.findByText(/Unicode response: 🎉/)).toBeInTheDocument();
    });
  });
});

describe('Frontend Edge Cases - UI Stability', () => {
  beforeEach(() => {
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.put.mockReset();
    mockAxiosInstance.delete.mockReset();
    mockAxiosInstance.patch.mockReset();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    cleanup();
  });

  describe('EDGE-011: Very Long User Messages', () => {
    it('should handle extremely long messages without breaking UI', async () => {
      // 15,000 character message
      const longMessage = 'a'.repeat(15000);
      const mockResponse: ChatResponse = {
        reply: 'Short response to long message',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type and send long message
      fireEvent.change(input, { target: { value: longMessage } });
      fireEvent.click(sendButton);

      // Verify message appears (check for beginning of message)
      await waitFor(() => {
        expect(screen.getByText(/^aaaaaa/)).toBeInTheDocument();
      });

      // Verify response appears
      expect(await screen.findByText('Short response to long message')).toBeInTheDocument();
    });
  });

  describe('EDGE-019: Very Long LLM Responses', () => {
    it('should handle very long responses without freezing', async () => {
      // 5,000+ character response
      const longResponse = 'Lorem ipsum dolor sit amet. '.repeat(200); // ~5,600 chars

      const mockResponse: ChatResponse = {
        reply: longResponse,
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Verify user message
      expect(await screen.findByText('Test')).toBeInTheDocument();

      // Verify long response renders (check for beginning)
      await waitFor(
        () => {
          expect(screen.getByText(/^Lorem ipsum/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
});

describe('Frontend Edge Cases - User Interactions', () => {
  beforeEach(() => {
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.put.mockReset();
    mockAxiosInstance.delete.mockReset();
    mockAxiosInstance.patch.mockReset();
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    cleanup();
  });

  describe('EDGE-015: Rapid Message Sending', () => {
    it('should prevent multiple simultaneous requests', async () => {
      let resolvePromise: any;
      const slowPromise = new Promise<any>((resolve) => {
        resolvePromise = resolve;
      });

      mockAxiosInstance.post.mockReturnValueOnce(slowPromise as any);

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type message
      fireEvent.change(input, { target: { value: 'Test message' } });

      // Click send button
      fireEvent.click(sendButton);

      // Verify user message appears
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Verify input is disabled (loading state)
      expect(input).toBeDisabled();

      // Try to click send again while loading (should not work)
      fireEvent.click(sendButton);
      fireEvent.click(sendButton);

      // Resolve the first request
      resolvePromise({
        data: {
          reply: 'Response',
          model: 'test-model',
          provider: 'lmstudio',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Response')).toBeInTheDocument();
      });

      // Verify only one API call was made (rapid clicks didn't create more)
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('EDGE-016: Clear Chat During Pending Request', () => {
    it('should handle clear chat while waiting for response', async () => {
      let resolvePromise: any;
      const slowPromise = new Promise<any>((resolve) => {
        resolvePromise = resolve;
      });

      mockAxiosInstance.post.mockReturnValueOnce(slowPromise as any);

      render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send message
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Verify user message appears
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      });

      // Clear chat while request is pending
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      // Chat should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Test')).not.toBeInTheDocument();
      });

      // Resolve the request (late response)
      resolvePromise({
        data: {
          reply: 'Late response',
          model: 'test-model',
          provider: 'lmstudio',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Wait a bit to see if late response appears
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Late response may or may not appear - this is acceptable behavior for MVP
      // Key point: app doesn't crash
      // (In a more sophisticated app, we'd cancel the pending request)
    });
  });

  describe('EDGE-017: Page Refresh During Request', () => {
    it('should clear conversation on page refresh (component remount)', async () => {
      const mockResponse: ChatResponse = {
        reply: 'Response 1',
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {} as any,
        } as any,
      });

      // First render - send message
      const { unmount } = render(<App />);

      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test message 1' } });
      fireEvent.click(sendButton);

      // Wait for messages
      await screen.findByText('Test message 1');
      await screen.findByText('Response 1');

      // Simulate page refresh (unmount and remount)
      unmount();
      render(<App />);

      // Verify conversation is cleared (expected MVP behavior - no localStorage)
      expect(screen.queryByText('Test message 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Response 1')).not.toBeInTheDocument();

      // Verify app is still functional
      const newInput = screen.getByPlaceholderText('Type your message...');
      expect(newInput).toBeInTheDocument();
      expect(newInput).toBeEnabled();
    });
  });
});
