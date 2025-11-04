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
 * - Security: command injection prevention
 */

import { LLMError, LLMErrorType } from '../types/llm';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process.spawn
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Set environment variables BEFORE importing the service
process.env.LLM_CLI_PATH = '/path/to/llm_call.py';
process.env.PYTHON_PATH = 'python3';
process.env.LLM_TIMEOUT_MS = '30000';

// Import after setting environment
import { callLLM } from '../services/llm';

/**
 * Helper to create mock spawn child process
 */
function createMockChildProcess() {
  const mockChild = new EventEmitter() as any;
  mockChild.stdout = new EventEmitter();
  mockChild.stderr = new EventEmitter();
  mockChild.kill = jest.fn();
  mockChild.killed = false;
  return mockChild;
}

describe('LLM Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful LLM Calls', () => {
    it('should return LLM response for simple message', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Hello');

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

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      const result = await resultPromise;

      expect(result).toEqual({
        reply: 'Hello! How can I help you?',
        model: 'llama-2-7b',
        provider: 'lmstudio',
      });

      // Verify spawn called with correct arguments (no shell)
      expect(mockSpawn).toHaveBeenCalledWith(
        'python3',
        expect.arrayContaining(['/path/to/llm_call.py', '--request-json']),
        expect.objectContaining({ shell: false })
      );
    });

    it('should handle messages with special characters', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM("Message with quotes: \"test\" and 'single' and newline\nhere");

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

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      const result = await resultPromise;
      expect(result.reply).toBe('Processed special chars');
    });

    it('should handle very long messages', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const longMessage = 'A'.repeat(10000);
      const resultPromise = callLLM(longMessage);

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

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      const result = await resultPromise;
      expect(result.reply).toBe('Processed long message');
    });

    it('should use default model and provider if missing', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      const response = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Response',
            },
          },
        ],
      };

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      const result = await resultPromise;
      expect(result.model).toBe('unknown');
      expect(result.provider).toBe('lmstudio');
    });
  });

  describe('Exit Code Error Handling', () => {
    it('should throw ValidationError for exit code 1', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.stderr.emit('data', Buffer.from('Request validation failed'));
      mockChild.emit('close', 1, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.VALIDATION,
        exitCode: 1,
        message: 'Invalid request format',
      });
    });

    it('should throw ProviderUnavailableError for exit code 2', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.stderr.emit('data', Buffer.from('Could not connect to LMStudio'));
      mockChild.emit('close', 2, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.PROVIDER_UNAVAILABLE,
        exitCode: 2,
        message: 'LMStudio provider unavailable',
      });
    });

    it('should throw LLMRequestError for exit code 3', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.stderr.emit('data', Buffer.from('Model rejected request'));
      mockChild.emit('close', 3, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.LLM_REQUEST_FAILED,
        exitCode: 3,
        message: 'LLM request failed',
      });
    });

    it('should throw UnexpectedError for exit code 4', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.stderr.emit('data', Buffer.from('Internal error occurred'));
      mockChild.emit('close', 4, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.UNEXPECTED,
        exitCode: 4,
        message: 'Unexpected error in llm_call.py',
      });
    });

    it('should handle unknown exit codes', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.stderr.emit('data', Buffer.from('Unknown subprocess error'));
      mockChild.emit('close', 99, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        exitCode: 99,
        message: 'Subprocess exited with unknown code 99',
      });
    });
  });

  describe('Timeout Handling', () => {
    it('should throw TimeoutError when subprocess times out', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      // Simulate timeout signal
      mockChild.emit('close', null, 'SIGTERM');

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.TIMEOUT,
        message: 'LLM request timed out after 30000ms',
      });
    });
  });

  describe('JSON Parsing Errors', () => {
    it('should throw ParseError for malformed JSON', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.stdout.emit('data', Buffer.from('not valid json'));
      mockChild.emit('close', 0, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Failed to parse LLM response JSON',
      });
    });

    it('should throw ParseError for empty response', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.emit('close', 0, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
      });
    });

    it('should throw ParseError for missing choices array', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      const response = {
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Invalid response structure: missing choices array',
      });
    });

    it('should throw ParseError for empty choices array', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      const response = {
        choices: [],
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Invalid response structure: missing choices array',
      });
    });

    it('should throw ParseError for missing message content', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      const response = {
        choices: [
          {
            message: {
              role: 'assistant',
            },
          },
        ],
        model: 'test-model',
        provider: 'lmstudio',
      };

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Invalid response structure: missing message content',
      });
    });
  });

  describe('Subprocess Spawn Errors', () => {
    it('should throw error when Python not found', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      const error: any = new Error('spawn python3 ENOENT');
      error.errno = 'ENOENT';
      // Don't set error.code to avoid it being treated as exit code
      mockChild.emit('error', error);

      await expect(resultPromise).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        message: 'Failed to spawn subprocess',
      });
    });

    it('should throw error when LLM_CLI_PATH not configured', async () => {
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
      const mockChildren = [
        createMockChildProcess(),
        createMockChildProcess(),
        createMockChildProcess(),
      ];

      let callIndex = 0;
      mockSpawn.mockImplementation(() => mockChildren[callIndex++]);

      const promises = [
        callLLM('Message 1'),
        callLLM('Message 2'),
        callLLM('Message 3'),
      ];

      // Simulate all responses
      mockChildren.forEach((child, index) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: `Response ${index + 1}`,
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        child.stdout.emit('data', Buffer.from(JSON.stringify(response)));
        child.emit('close', 0, null);
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0].reply).toBe('Response 1');
      expect(results[1].reply).toBe('Response 2');
      expect(results[2].reply).toBe('Response 3');
    });
  });

  describe('Security', () => {
    it('should prevent command injection via PYTHON_PATH', async () => {
      // With spawn(), malicious PYTHON_PATH won't be interpreted by shell
      // because spawn() doesn't invoke a shell when shell=false
      // The malicious command will be treated as a literal filename and fail

      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('test');

      // If using spawn with shell=false, the command is executed directly
      // Malicious environment variables are treated as literal strings, not interpreted
      const error: any = new Error('spawn ENOENT');
      error.code = 'ENOENT';
      mockChild.emit('error', error);

      // Verify that spawn is called with shell: false
      // This prevents any shell interpretation of environment variables
      await expect(resultPromise).rejects.toBeDefined();

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ shell: false })
      );
    });

    it('should pass arguments as array (not shell string)', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test message');

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

      mockChild.stdout.emit('data', Buffer.from(JSON.stringify(response)));
      mockChild.emit('close', 0, null);

      await resultPromise;

      // Verify spawn called with args array, not shell command string
      expect(mockSpawn).toHaveBeenCalledWith(
        'python3',
        expect.arrayContaining([
          '/path/to/llm_call.py',
          '--request-json',
          expect.any(String),
        ]),
        expect.objectContaining({ shell: false })
      );

      // Verify arguments don't contain shell metacharacters from escaping
      const spawnArgs = mockSpawn.mock.calls[0];
      const requestJsonArg = spawnArgs[1][2]; // Third element in args array

      // Should NOT contain shell escape sequences like '\''
      expect(requestJsonArg).not.toContain("\\'");
    });
  });

  describe('Subprocess stderr Capture', () => {
    it('should capture stderr in error details', async () => {
      const mockChild = createMockChildProcess();
      mockSpawn.mockReturnValue(mockChild);

      const resultPromise = callLLM('Test');

      mockChild.stderr.emit('data', Buffer.from('Detailed error from Python script'));
      mockChild.emit('close', 3, null);

      try {
        await resultPromise;
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMError);
        expect((error as LLMError).details).toContain('Detailed error from Python script');
      }
    });
  });
});
