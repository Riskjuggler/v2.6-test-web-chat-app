/**
 * Backend Edge Case Tests
 *
 * High-risk edge case scenarios for backend LLM service:
 * - Subprocess timeout handling
 * - Malformed JSON responses
 * - Special characters (quotes, newlines, Unicode, emoji)
 * - Very long messages (>10K chars)
 * - Concurrent request handling
 * - Environment variable edge cases
 * - Unknown exit codes
 *
 * These tests cover scenarios NOT in unit/integration tests.
 */

import { LLMError, LLMErrorType } from '../../types/llm';
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
import { callLLM } from '../../services/llm';

describe('Backend Edge Case Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure environment is set
    process.env.LLM_CLI_PATH = '/path/to/llm_call.py';
    process.env.PYTHON_PATH = 'python3';
    process.env.LLM_TIMEOUT_MS = '30000';
  });

  describe('Subprocess Timeout Edge Cases', () => {
    it('should handle timeout with SIGTERM signal', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Process killed');
        error.killed = true;
        error.signal = 'SIGTERM';
        callback(error, { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test message')).rejects.toMatchObject({
        type: LLMErrorType.TIMEOUT,
        message: 'LLM request timed out after 30000ms',
      });
    });

    it('should handle timeout with SIGKILL signal', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Process killed');
        error.killed = true;
        error.signal = 'SIGKILL';
        callback(error, { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test message')).rejects.toMatchObject({
        type: LLMErrorType.TIMEOUT,
        message: 'LLM request timed out after 30000ms',
      });
    });

    it('should handle killed flag without signal', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Process killed');
        error.killed = true;
        // No signal property
        callback(error, { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test message')).rejects.toMatchObject({
        type: LLMErrorType.TIMEOUT,
      });
    });
  });

  describe('Malformed JSON Edge Cases', () => {
    it('should handle completely invalid JSON syntax', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: '{this is not json at all!', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
        message: 'Failed to parse LLM response JSON',
      });
    });

    it('should handle incomplete JSON (truncated mid-object)', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: '{"choices":[{"message":{"role":"assistant","content":"Hello', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
      });
    });

    it('should handle JSON with wrong data types', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const badResponse = {
          choices: 'not an array', // Should be array
          model: 123, // Should be string
          provider: true, // Should be string
        };
        callback(null, { stdout: JSON.stringify(badResponse), stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
      });
    });

    it('should handle JSON array instead of object', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callback(null, { stdout: '[{"invalid": "structure"}]', stderr: '' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.PARSE_ERROR,
      });
    });

    it('should handle null response', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        // When JSON.parse('null') succeeds but returns null,
        // response.choices will be undefined, triggering parse error
        callback(null, { stdout: 'null', stderr: '' });
        return {} as any;
      });

      // The actual behavior: null parses successfully but fails structure validation
      await expect(callLLM('Test')).rejects.toThrow();
    });
  });

  describe('Special Character Edge Cases', () => {
    it('should handle message with Unicode characters', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed Unicode message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const unicodeMessage = 'Hello 世界 🌍 Привет मस्ते';
      const result = await callLLM(unicodeMessage);

      expect(result.reply).toBe('Processed Unicode message');
    });

    it('should handle message with emoji', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed emoji message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const emojiMessage = 'Test 😀 🎉 🚀 ❤️ 👍';
      const result = await callLLM(emojiMessage);

      expect(result.reply).toBe('Processed emoji message');
    });

    it('should handle message with backslashes', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed backslash message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const backslashMessage = 'Test\\with\\backslashes\\path\\to\\file';
      const result = await callLLM(backslashMessage);

      expect(result.reply).toBe('Processed backslash message');
    });

    it('should handle message with mixed quotes and escapes', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed complex message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const complexMessage = `He said "it's a 'test'\\nwith\ttabs"`;
      const result = await callLLM(complexMessage);

      expect(result.reply).toBe('Processed complex message');
    });

    it('should handle message with tabs and newlines', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed whitespace message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const whitespaceMessage = 'Line 1\nLine 2\tTabbed\rCarriage return';
      const result = await callLLM(whitespaceMessage);

      expect(result.reply).toBe('Processed whitespace message');
    });
  });

  describe('Very Long Message Edge Cases', () => {
    it('should handle 10K character message', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed 10K message',
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

      expect(result.reply).toBe('Processed 10K message');
      expect(mockExec).toHaveBeenCalledTimes(1);
    });

    it('should handle 50K character message', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed 50K message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const veryLongMessage = 'B'.repeat(50000);
      const result = await callLLM(veryLongMessage);

      expect(result.reply).toBe('Processed 50K message');
    });

    it('should handle 100K character message', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Processed 100K message',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        callback(null, { stdout: JSON.stringify(response), stderr: '' });
        return {} as any;
      });

      const extremelyLongMessage = 'C'.repeat(100000);
      const result = await callLLM(extremelyLongMessage);

      expect(result.reply).toBe('Processed 100K message');
    });
  });

  describe('Concurrent Request Edge Cases', () => {
    it('should handle 5 concurrent requests without interference', async () => {
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
        }, Math.random() * 20);
        return {} as any;
      });

      const promises = [
        callLLM('Message 1'),
        callLLM('Message 2'),
        callLLM('Message 3'),
        callLLM('Message 4'),
        callLLM('Message 5'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.reply).toContain('Response');
      });
      expect(mockExec).toHaveBeenCalledTimes(5);
    });

    it('should handle 10 rapid concurrent requests', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const response = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Concurrent response',
              },
            },
          ],
          model: 'test-model',
          provider: 'lmstudio',
        };
        setTimeout(() => {
          callback(null, { stdout: JSON.stringify(response), stderr: '' });
        }, 5);
        return {} as any;
      });

      const promises = Array.from({ length: 10 }, (_, i) => callLLM(`Message ${i}`));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockExec).toHaveBeenCalledTimes(10);
    });

    it('should handle mixed success/failure in concurrent requests', async () => {
      let callCount = 0;
      mockExec.mockImplementation((cmd, options, callback: any) => {
        callCount++;
        if (callCount % 2 === 0) {
          // Even calls fail
          const error: any = new Error('Simulated failure');
          error.code = 3;
          callback(error, { stdout: '', stderr: 'Simulated failure' });
        } else {
          // Odd calls succeed
          const response = {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'Success',
                },
              },
            ],
            model: 'test-model',
            provider: 'lmstudio',
          };
          callback(null, { stdout: JSON.stringify(response), stderr: '' });
        }
        return {} as any;
      });

      const promises = [
        callLLM('Message 1').catch((e) => e),
        callLLM('Message 2').catch((e) => e),
        callLLM('Message 3').catch((e) => e),
        callLLM('Message 4').catch((e) => e),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(results[0].reply).toBe('Success'); // Odd call
      expect(results[1]).toBeInstanceOf(LLMError); // Even call
      expect(results[2].reply).toBe('Success'); // Odd call
      expect(results[3]).toBeInstanceOf(LLMError); // Even call
    });
  });

  describe('Environment Variable Edge Cases', () => {
    it('should throw error when LLM_CLI_PATH is empty string', async () => {
      jest.isolateModules(() => {
        process.env.LLM_CLI_PATH = '';
        process.env.PYTHON_PATH = 'python3';

        const { callLLM } = require('../../services/llm');

        expect(callLLM('Test')).rejects.toMatchObject({
          type: LLMErrorType.SUBPROCESS_ERROR,
          message: 'LLM_CLI_PATH environment variable not set',
        });
      });
    });

    it('should throw error when LLM_CLI_PATH is undefined', async () => {
      jest.isolateModules(() => {
        delete process.env.LLM_CLI_PATH;
        process.env.PYTHON_PATH = 'python3';

        const { callLLM } = require('../../services/llm');

        expect(callLLM('Test')).rejects.toMatchObject({
          type: LLMErrorType.SUBPROCESS_ERROR,
        });
      });
    });

    it('should use default timeout when LLM_TIMEOUT_MS is invalid', async () => {
      jest.isolateModules(() => {
        process.env.LLM_CLI_PATH = '/path/to/llm_call.py';
        process.env.PYTHON_PATH = 'python3';
        process.env.LLM_TIMEOUT_MS = 'not-a-number';

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

        const { callLLM } = require('../../services/llm');

        // Should use default timeout (30000ms) when LLM_TIMEOUT_MS is invalid
        expect(callLLM('Test')).rejects.toMatchObject({
          type: LLMErrorType.TIMEOUT,
        });
      });
    });

    it('should use custom timeout from environment', async () => {
      jest.isolateModules(() => {
        process.env.LLM_CLI_PATH = '/path/to/llm_call.py';
        process.env.PYTHON_PATH = 'python3';
        process.env.LLM_TIMEOUT_MS = '5000';

        jest.mock('child_process', () => ({
          exec: jest.fn(),
        }));

        const childProcess = require('child_process');
        childProcess.exec.mockImplementation((cmd: any, options: any, callback: any) => {
          expect(options.timeout).toBe(5000);
          const error: any = new Error('Timeout');
          error.killed = true;
          callback(error, { stdout: '', stderr: '' });
          return {} as any;
        });

        const { callLLM } = require('../../services/llm');

        expect(callLLM('Test')).rejects.toMatchObject({
          type: LLMErrorType.TIMEOUT,
          message: 'LLM request timed out after 5000ms',
        });
      });
    });
  });

  describe('Unknown Exit Code Edge Cases', () => {
    it('should handle exit code 5', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Unknown error');
        error.code = 5;
        callback(error, { stdout: '', stderr: 'Unknown error code 5' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        exitCode: 5,
        message: 'Subprocess exited with unknown code 5',
      });
    });

    it('should handle exit code 127 (command not found)', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Command not found');
        error.code = 127;
        callback(error, { stdout: '', stderr: 'command not found' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        exitCode: 127,
        message: 'Subprocess exited with unknown code 127',
      });
    });

    it('should handle exit code 255', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Exit 255');
        error.code = 255;
        callback(error, { stdout: '', stderr: 'Exit code 255' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        exitCode: 255,
      });
    });

    it('should handle negative exit codes', async () => {
      mockExec.mockImplementation((cmd, options, callback: any) => {
        const error: any = new Error('Negative exit');
        error.code = -1;
        callback(error, { stdout: '', stderr: 'Negative exit code' });
        return {} as any;
      });

      await expect(callLLM('Test')).rejects.toMatchObject({
        type: LLMErrorType.SUBPROCESS_ERROR,
        exitCode: -1,
      });
    });
  });
});
