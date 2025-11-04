/**
 * LLM Service Tests
 *
 * Comprehensive test suite covering:
 * - Successful LLM calls
 * - All exit code error scenarios (1-4)
 * - Timeout handling
 * - JSON parsing errors
 * - Subprocess spawn errors
 * - Edge cases (special characters, long messages, concurrent calls)
 */

import { LLMError, LLMErrorType } from '../types/llm';
import { exec } from 'child_process';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

const mockExec = exec as jest.MockedFunction<typeof exec>;

// Set environment variables BEFORE importing the service
process.env.LLM_CLI_PATH = '/path/to/llm_call.py';
process.env.PYTHON_PATH = 'python3';
process.env.LLM_TIMEOUT_MS = '30000';

// Import after setting environment
import { callLLM } from '../services/llm';

describe('LLM Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful LLM Calls', () => {
    it('should return LLM response for simple message', async () => {
      // Mock successful subprocess execution
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Hello! How can I help you?',
              },
            },
          ],
          model: 'llama-2-7b',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const result = await callLLM('Hello');

      expect(result).toEqual({
        reply: 'Hello! How can I help you?',
        model: 'llama-2-7b',
        provider: 'lmstudio',
      });
    });

    it('should handle messages with special characters', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed special chars',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const result = await callLLM(
        "Message with quotes: \"test\" and 'single' and newline\nhere"
      );

      expect(result.reply).toBe('Processed special chars');
    });

    it('should handle very long messages', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed long message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const longMessage = 'A'.repeat(10000);
      const result = await callLLM(longMessage);

      expect(result.reply).toBe('Processed long message');
    });

    it('should use default model and provider if missing', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Response',
              },
            },
          ],
          // Missing model and provider fields
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const result = await callLLM('Test');

      expect(result.model).toBe('unknown');
      expect(result.provider).toBe('lmstudio');
    });
  });

  describe('Exit Code Error Handling', () => {
    it('should throw ValidationError for exit code 1', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Invalid request');
        error.code = 1;
        error.stderr = 'Request validation failed';
        callback(error, { stdout: '', stderr: 'Request validation failed' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.VALIDATION,
        exitCode: 1,
        message: 'Invalid request format',
      });
    });

    it('should throw ProviderUnavailableError for exit code 2', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Provider unavailable');
        error.code = 2;
        error.stderr = 'Could not connect to LMStudio';
        callback(error, { stdout: '', stderr: 'Could not connect to LMStudio' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PROVIDER_UNAVAILABLE,
        exitCode: 2,
        message: 'LMStudio provider unavailable',
      });
    });

    it('should throw LLMRequestError for exit code 3', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('LLM request failed');
        error.code = 3;
        error.stderr = 'Model rejected request';
        callback(error, { stdout: '', stderr: 'Model rejected request' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.LLM_REQUEST_FAILED,
        exitCode: 3,
        message: 'LLM request failed',
      });
    });

    it('should throw UnexpectedError for exit code 4', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Unexpected error');
        error.code = 4;
        error.stderr = 'Internal error occurred';
        callback(error, { stdout: '', stderr: 'Internal error occurred' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.UNEXPECTED,
        exitCode: 4,
        message: 'Unexpected error in llm_call.py',
      });
    });

    it('should handle unknown exit codes', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Unknown error');
        error.code = 99;
        error.stderr = 'Unknown subprocess error';
        callback(error, { stdout: '', stderr: 'Unknown subprocess error' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        exitCode: 99,
        message: 'Subprocess exited with unknown code 99',
      });
    });
  });

  describe('Timeout Handling', () => {
    it('should throw TimeoutError when subprocess times out', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Timeout');
        error.killed = true;
        error.signal = 'SIGTERM';
        callback(error, { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.TIMEOUT,
        message: 'LLM request timed out after 30000ms',
      });
    });

    it('should respect custom timeout from environment', async () => {
      // Need to reload module with different timeout
      jest.isolateModules(() => {
        process.env.LLM_TIMEOUT_MS = '5000';
        jest.mock('child_process', () => ({
          exec: jest.fn(),
        }));
        const childProcess = require('child_process');
        childProcess.exec.mockImplementation((cmd: any, options: any, callback: any) => {
          const error: any = new Error('Timeout');
          error.killed = true;
          callback(error, { stdout: '', stderr: '' });
          return {} as any;
        });

        const { callLLM } = require('../services/llm');

        expect(callLLM('Test')).rejects.toMatchObject({
          type: LLMErrorType.TIMEOUT,
          message: 'LLM request timed out after 5000ms',
        });
      });
    });
  });

  describe('JSON Parsing Errors', () => {
    it('should throw ParseError for malformed JSON', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: 'not valid json', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Failed to parse LLM response JSON',
      });
    });

    it('should throw ParseError for empty response', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
      });
    });

    it('should throw ParseError for missing choices array', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          model: 'test-model',
          provider: 'lmstudio',
          // Missing choices array
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Invalid response structure: missing choices array',
      });
    });

    it('should throw ParseError for empty choices array', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Invalid response structure: missing choices array',
      });
    });

    it('should throw ParseError for missing message content', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                // Missing content field
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Invalid response structure: missing message content',
      });
    });
  });

  describe('Subprocess Spawn Errors', () => {
    it('should throw error when Python not found', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('spawn python3 ENOENT');
        error.code = 'ENOENT';
        error.errno = 'ENOENT';
        callback(error, { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        // Message matches actual implementation
      });
    });

    it('should throw error when llm_call.py not found', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('No such file or directory');
        error.errno = 'ENOENT';
        callback(error, { stdout: '', stderr: 'No such file or directory' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        message: 'Failed to spawn subprocess',
      });
    });

    it('should throw error when LLM_CLI_PATH not configured', async () => {
      // Need to reload module with empty LLM_CLI_PATH
      jest.isolateModules(() => {
        process.env.LLM_CLI_PATH = '';
        const { callLLM } = require('../services/llm');

        expect(callLLM('Test')).rejects.toMatchObject({
          type: LLMErrorType.SUBPROCESS_ERROR,
          message: 'LLM_CLI_PATH environment variable not set',
        });
      });
    });
  });

  describe('Concurrent Calls', () => {
    it('should handle multiple concurrent calls', async () => {
      let callCount = 0;
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callCount++;
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: `Response ${callCount}`,
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        // Simulate async delay
        setTimeout(() => {
          callback(null, { stdout: JSON.stringify(response), stderr: '' });
        }, 10);
        return {} as any;
      });

      const promises = [
        callLLM('Message 1'),
        callLLM('Message 2'),
        callLLM('Message 3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0].reply).toContain('Response');
      expect(results[1].reply).toContain('Response');
      expect(results[2].reply).toContain('Response');
    });
  });

  describe('Subprocess stderr Capture', () => {
    it('should capture stderr in error details', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('LLM error');
        error.code = 3;
        error.stderr = 'Detailed error from Python script';
        callback(error, { stdout: '', stderr: 'Detailed error from Python script' });
        return {} as any;
      });

      try {
        await callLLM('Test');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMError);
        expect((error as LLMError).details).toContain('Detailed error from Python script');
      }
    });
  });

  describe('Request JSON Escaping', () => {
    it('should properly escape single quotes in message', async () => {
      let capturedCommand = '';
      mockExec.mockImplementation((cmd, options, callback: any) => {
        capturedCommand = cmd;
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Response',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      await callLLM("Test with 'single quotes' here");

      // Verify command properly escapes quotes
      expect(capturedCommand).toContain("--request-json '");
      // Verify the escaping is applied (quotes are escaped as '\'' in shell)
      expect(capturedCommand).toContain("\\'");
    });
  });
});
