/**
 * Chat Route Unit Tests
 *
 * Tests POST /api/chat endpoint with Supertest
 * Mocks callLLM service to avoid external dependencies
 * Covers all success and error scenarios
 */

import request from 'supertest';
import { app } from '../../index';
import { callLLM } from '../../services/llm';
import { LLMError, LLMErrorType } from '../../types/llm';

// Mock the LLM service
jest.mock('../../services/llm');
const mockCallLLM = callLLM as jest.MockedFunction<typeof callLLM>;

describe('POST /api/chat', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return 200 with reply, model, and provider for valid request', async () => {
      // Arrange
      const userMessage = 'Hello, how are you?';
      const mockResponse = {
        reply: 'I am doing well, thank you!',
        model: 'llama-3.2-3b',
        provider: 'lmstudio',
      };
      mockCallLLM.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: userMessage })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        reply: mockResponse.reply,
        model: mockResponse.model,
        provider: mockResponse.provider,
      });
      expect(mockCallLLM).toHaveBeenCalledWith(userMessage);
      expect(mockCallLLM).toHaveBeenCalledTimes(1);
    });

    it('should handle message with leading/trailing whitespace', async () => {
      // Arrange
      const userMessage = '  What is 2+2?  ';
      const mockResponse = {
        reply: '2+2 equals 4',
        model: 'llama-3.2-3b',
        provider: 'lmstudio',
      };
      mockCallLLM.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: userMessage })
        .expect(200);

      // Assert
      expect(response.body.reply).toBe(mockResponse.reply);
      expect(mockCallLLM).toHaveBeenCalledWith(userMessage);
    });
  });

  describe('Validation Error Cases (400)', () => {
    it('should return 400 when message field is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Message field is required',
      });
      expect(mockCallLLM).not.toHaveBeenCalled();
    });

    it('should return 400 when message is null', async () => {
      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: null })
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Message field is required',
      });
      expect(mockCallLLM).not.toHaveBeenCalled();
    });

    it('should return 400 when message is not a string', async () => {
      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 12345 })
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Message must be a string',
      });
      expect(mockCallLLM).not.toHaveBeenCalled();
    });

    it('should return 400 when message is an empty string', async () => {
      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' })
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Message cannot be empty',
      });
      expect(mockCallLLM).not.toHaveBeenCalled();
    });

    it('should return 400 when message is only whitespace', async () => {
      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '   \t\n   ' })
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: 'Message cannot be empty',
      });
      expect(mockCallLLM).not.toHaveBeenCalled();
    });
  });

  describe('LLM Service Error Cases', () => {
    it('should return 503 when LLM provider is unavailable', async () => {
      // Arrange
      const error = new LLMError(
        LLMErrorType.PROVIDER_UNAVAILABLE,
        2,
        'LMStudio provider unavailable',
        'Connection refused'
      );
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect('Content-Type', /json/)
        .expect(503);

      // Assert
      expect(response.body).toEqual({
        error: 'Service Unavailable',
        message: 'LLM provider is not available. Please ensure LMStudio is running.',
      });
      expect(mockCallLLM).toHaveBeenCalledWith('Hello');
    });

    it('should return 504 when LLM request times out', async () => {
      // Arrange
      const error = new LLMError(
        LLMErrorType.TIMEOUT,
        null,
        'LLM request timed out after 30000ms',
        'SIGTERM'
      );
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Complex question' })
        .expect(504);

      // Assert
      expect(response.body).toEqual({
        error: 'Gateway Timeout',
        message: 'LLM request timed out. Please try again.',
      });
    });

    it('should return 500 for LLM validation errors', async () => {
      // Arrange
      const error = new LLMError(
        LLMErrorType.VALIDATION,
        1,
        'Invalid request format',
        'Missing provider field'
      );
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to process your message. Please try again.',
      });
    });

    it('should return 500 for LLM parse errors', async () => {
      // Arrange
      const error = new LLMError(
        LLMErrorType.PARSE_ERROR,
        null,
        'Failed to parse LLM response JSON',
        'Invalid JSON'
      );
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to process your message. Please try again.');
    });

    it('should return 500 for LLM request failures', async () => {
      // Arrange
      const error = new LLMError(
        LLMErrorType.LLM_REQUEST_FAILED,
        3,
        'LLM request failed',
        'Model returned error'
      );
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should return 500 for subprocess errors', async () => {
      // Arrange
      const error = new LLMError(
        LLMErrorType.SUBPROCESS_ERROR,
        null,
        'Failed to spawn subprocess',
        'Python not found'
      );
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should return 500 for unexpected LLM errors', async () => {
      // Arrange
      const error = new LLMError(
        LLMErrorType.UNEXPECTED,
        4,
        'Unexpected error',
        'Unknown error'
      );
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('Unexpected Error Cases', () => {
    it('should return 500 for non-LLMError exceptions', async () => {
      // Arrange
      const error = new Error('Unexpected runtime error');
      mockCallLLM.mockRejectedValue(error);

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again.',
      });
    });
  });
});
