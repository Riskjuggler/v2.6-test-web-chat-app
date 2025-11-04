/**
 * Chat API Integration Tests
 *
 * Tests the complete backend flow: HTTP request → chat route → llm service → subprocess
 * Mocks child_process.exec to simulate llm_call.py responses without actual subprocess execution
 * Covers all exit codes (0, 1, 2, 3, 4), timeout scenarios, and malformed JSON responses
 *
 * This differs from unit tests (routes/chat.test.ts) which mock at the service level.
 * Integration tests verify the complete request/response flow including subprocess handling.
 */

import request from 'supertest';
import { app } from '../../index';
import { exec } from 'child_process';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const mockExec = exec as jest.MockedFunction<typeof exec>;

describe('Chat API Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Set required environment variables for LLM service
    process.env.LLM_CLI_PATH = '/path/to/llm_call.py';
    process.env.PYTHON_PATH = 'python3';
    process.env.LLM_TIMEOUT_MS = '30000';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.LLM_CLI_PATH;
    delete process.env.PYTHON_PATH;
    delete process.env.LLM_TIMEOUT_MS;
  });

  describe('Success Cases (Exit Code 0)', () => {
    it('should return 200 with LLM response for valid message', async () => {
      // Arrange: Mock successful subprocess execution
      const mockLLMResponse = {
        provider: 'lmstudio',
        model: 'llama-3.2-3b',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you today?',
            },
          },
        ],
      };

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: JSON.stringify(mockLLMResponse), stderr: '' });
        return {} as any;
      });

      // Act: Send POST request to /api/chat
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toEqual({
        reply: 'Hello! How can I help you today?',
        model: 'llama-3.2-3b',
        provider: 'lmstudio',
      });

      // Verify subprocess was called with correct command
      expect(mockExec).toHaveBeenCalledTimes(1);
      const commandArg = mockExec.mock.calls[0][0];
      expect(commandArg).toContain('python3');
      expect(commandArg).toContain('/path/to/llm_call.py');
      expect(commandArg).toContain('--request-json');
    });

    it('should handle multi-line LLM responses', async () => {
      // Arrange
      const mockLLMResponse = {
        provider: 'lmstudio',
        model: 'llama-3.2-3b',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Here are three points:\n1. First point\n2. Second point\n3. Third point',
            },
          },
        ],
      };

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: JSON.stringify(mockLLMResponse), stderr: '' });
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Give me three points' })
        .expect(200);

      // Assert
      expect(response.body.reply).toContain('1. First point');
      expect(response.body.reply).toContain('2. Second point');
      expect(response.body.reply).toContain('3. Third point');
    });

    it('should handle special characters in user message', async () => {
      // Arrange
      const mockLLMResponse = {
        provider: 'lmstudio',
        model: 'llama-3.2-3b',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'I understand your question about quotes.',
            },
          },
        ],
      };

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: JSON.stringify(mockLLMResponse), stderr: '' });
        return {} as any;
      });

      // Act: Send message with quotes and special characters
      const response = await request(app)
        .post('/api/chat')
        .send({ message: "What's the meaning of 'life'?" })
        .expect(200);

      // Assert
      expect(response.body.reply).toBe('I understand your question about quotes.');
    });
  });

  describe('Validation Error Cases (Exit Code 1)', () => {
    it('should return 500 when subprocess exits with code 1 (invalid request)', async () => {
      // Arrange: Mock subprocess failure with exit code 1
      const mockError: any = new Error('Command failed');
      mockError.code = 1;
      mockError.stderr = 'Invalid request format: missing provider field';

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(mockError, '', mockError.stderr || '');
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect('Content-Type', /json/)
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'Failed to process your message. Please try again.',
      });
    });
  });

  describe('Provider Unavailable Cases (Exit Code 2)', () => {
    it('should return 503 when subprocess exits with code 2 (provider unavailable)', async () => {
      // Arrange: Mock provider unavailable error
      const mockError: any = new Error('Command failed');
      mockError.code = 2;
      mockError.stderr = 'Connection refused to http://localhost:1234';

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(mockError, '', mockError.stderr || '');
        return {} as any;
      });

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
    });
  });

  describe('LLM Request Failed Cases (Exit Code 3)', () => {
    it('should return 500 when subprocess exits with code 3 (LLM request failed)', async () => {
      // Arrange: Mock LLM request failure
      const mockError: any = new Error('Command failed');
      mockError.code = 3;
      mockError.stderr = 'Model returned 500 Internal Server Error';

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(mockError, '', mockError.stderr || '');
        return {} as any;
      });

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
  });

  describe('Unexpected Error Cases (Exit Code 4)', () => {
    it('should return 500 when subprocess exits with code 4 (unexpected error)', async () => {
      // Arrange: Mock unexpected error
      const mockError: any = new Error('Command failed');
      mockError.code = 4;
      mockError.stderr = 'Unexpected Python exception: KeyError';

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(mockError, '', mockError.stderr || '');
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('Timeout Scenarios', () => {
    it('should return 504 when subprocess times out', async () => {
      // Arrange: Mock timeout error
      const mockError: any = new Error('Command timed out');
      mockError.killed = true;
      mockError.signal = 'SIGTERM';

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(mockError, '', mockError.stderr || '');
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Complex question requiring long processing' })
        .expect(504);

      // Assert
      expect(response.body).toEqual({
        error: 'Gateway Timeout',
        message: 'LLM request timed out. Please try again.',
      });
    });
  });

  describe('Malformed JSON Response Cases', () => {
    it('should return 500 when subprocess returns invalid JSON', async () => {
      // Arrange: Mock subprocess returning malformed JSON
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: 'This is not valid JSON{', stderr: '' });
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should return 500 when response missing choices array', async () => {
      // Arrange: Mock response with missing choices
      const invalidResponse = {
        provider: 'lmstudio',
        model: 'llama-3.2-3b',
        // Missing 'choices' field
      };

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: JSON.stringify(invalidResponse), stderr: '' });
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should return 500 when response has empty choices array', async () => {
      // Arrange: Mock response with empty choices
      const invalidResponse = {
        provider: 'lmstudio',
        model: 'llama-3.2-3b',
        choices: [], // Empty array
      };

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: JSON.stringify(invalidResponse), stderr: '' });
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should return 500 when response missing message content', async () => {
      // Arrange: Mock response with missing content
      const invalidResponse = {
        provider: 'lmstudio',
        model: 'llama-3.2-3b',
        choices: [
          {
            message: {
              role: 'assistant',
              // Missing 'content' field
            },
          },
        ],
      };

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: JSON.stringify(invalidResponse), stderr: '' });
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('HTTP Validation Cases', () => {
    it('should return 400 when message field is missing', async () => {
      // Act: Send request without message field
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

      // Verify subprocess was NOT called
      expect(mockExec).not.toHaveBeenCalled();
    });

    it('should return 400 when message is empty string', async () => {
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
      expect(mockExec).not.toHaveBeenCalled();
    });

    it('should return 400 when message is only whitespace', async () => {
      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '   \t\n   ' })
        .expect(400);

      // Assert
      expect(response.body.message).toBe('Message cannot be empty');
      expect(mockExec).not.toHaveBeenCalled();
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
      expect(mockExec).not.toHaveBeenCalled();
    });
  });

  describe('Environment Configuration Cases', () => {
    it('should return 500 when LLM_CLI_PATH is not set', async () => {
      // Arrange: Remove LLM_CLI_PATH environment variable
      delete process.env.LLM_CLI_PATH;

      // Act
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal Server Error');
      expect(mockExec).not.toHaveBeenCalled();
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in successful response', async () => {
      // Arrange
      const mockLLMResponse = {
        provider: 'lmstudio',
        model: 'llama-3.2-3b',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello!',
            },
          },
        ],
      };

      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: JSON.stringify(mockLLMResponse), stderr: '' });
        return {} as any;
      });

      // Act
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .send({ message: 'Hello' })
        .expect(200);

      // Assert: Verify CORS headers present
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should include CORS headers in error response', async () => {
      // Act: Send invalid request
      const response = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .send({})
        .expect(400);

      // Assert: Verify CORS headers present even on error
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });
});
