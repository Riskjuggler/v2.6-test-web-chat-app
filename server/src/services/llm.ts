/**
 * LLM Service - Subprocess Wrapper
 *
 * Executes llm_call.py via subprocess to communicate with LLM providers
 * Handles JSON request/response serialization and exit code error mapping
 */

import { spawn } from 'child_process';
import {
  LLMRequest,
  LLMResponse,
  LLMResult,
  LLMError,
  LLMErrorType,
} from '../types/llm';

/**
 * Spawn-based subprocess wrapper (secure, no shell invocation)
 *
 * Executes a command with arguments array, avoiding shell interpretation
 * of special characters. This prevents command injection vulnerabilities.
 */
function spawnAsync(
  command: string,
  args: string[],
  options: { timeout: number; maxBuffer?: number }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false, // CRITICAL: No shell spawning
      timeout: options.timeout,
    });

    let stdout = '';
    let stderr = '';
    const maxBuffer = options.maxBuffer || 1024 * 1024;

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > maxBuffer) {
        child.kill();
        reject(new Error('maxBuffer exceeded'));
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > maxBuffer) {
        child.kill();
        reject(new Error('maxBuffer exceeded'));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code, signal) => {
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        const error: any = new Error(`Process killed with signal ${signal}`);
        error.killed = true;
        error.signal = signal;
        reject(error);
      } else if (code !== 0) {
        const error: any = new Error(`Process exited with code ${code}`);
        error.code = code;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Handle timeout
    if (options.timeout) {
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
        }
      }, options.timeout);
    }
  });
}

/**
 * Configuration from environment variables
 */
const LLM_CLI_PATH = process.env.LLM_CLI_PATH || '';
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '30000', 10);

/**
 * Call LLM with user message
 *
 * Executes llm_call.py subprocess with JSON request, parses response,
 * and handles all error scenarios (exit codes, timeouts, malformed JSON)
 *
 * @param userMessage - User's message to send to LLM
 * @returns LLM response with reply, model, and provider
 * @throws LLMError - For all error scenarios with appropriate type
 *
 * Exit Code Mapping:
 * - 0: Success
 * - 1: Invalid request format
 * - 2: Provider unavailable
 * - 3: LLM request failed
 * - 4: Unexpected error
 */
export async function callLLM(userMessage: string): Promise<LLMResult> {
  // Validate environment configuration
  if (!LLM_CLI_PATH) {
    throw new LLMError(
      LLMErrorType.SUBPROCESS_ERROR,
      null,
      'LLM_CLI_PATH environment variable not set',
      'Configure LLM_CLI_PATH in .env file'
    );
  }

  // Build request object
  const request: LLMRequest = {
    provider: 'lmstudio',
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  };

  // Serialize request to JSON (no shell escaping needed with spawn)
  const requestJson = JSON.stringify(request);

  // Build argument array for spawn (SECURE: no shell interpretation)
  const args = [LLM_CLI_PATH, '--request-json', requestJson];

  try {
    // Execute subprocess with timeout (using spawn, not exec)
    const { stdout, stderr } = await spawnAsync(PYTHON_PATH, args, {
      timeout: LLM_TIMEOUT_MS,
      maxBuffer: 1024 * 1024, // 1MB buffer for large responses
    });

    // Parse JSON response from stdout
    let response: LLMResponse;
    try {
      response = JSON.parse(stdout);
    } catch (parseError) {
      throw new LLMError(
        LLMErrorType.PARSE_ERROR,
        null,
        'Failed to parse LLM response JSON',
        `stdout: ${stdout.substring(0, 200)}, stderr: ${stderr}`
      );
    }

    // Validate response structure
    if (
      !response.choices ||
      !Array.isArray(response.choices) ||
      response.choices.length === 0
    ) {
      throw new LLMError(
        LLMErrorType.PARSE_ERROR,
        null,
        'Invalid response structure: missing choices array',
        JSON.stringify(response)
      );
    }

    // Extract message content
    const content = response.choices[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new LLMError(
        LLMErrorType.PARSE_ERROR,
        null,
        'Invalid response structure: missing message content',
        JSON.stringify(response.choices[0])
      );
    }

    // Return successful result
    return {
      reply: content,
      model: response.model || 'unknown',
      provider: response.provider || 'lmstudio',
    };
  } catch (error: any) {
    // Handle timeout errors
    if (error.killed || error.signal === 'SIGTERM') {
      throw new LLMError(
        LLMErrorType.TIMEOUT,
        null,
        `LLM request timed out after ${LLM_TIMEOUT_MS}ms`,
        error.message
      );
    }

    // If already LLMError, re-throw
    if (error instanceof LLMError) {
      throw error;
    }

    // Handle subprocess exit codes
    if (error.code !== undefined) {
      const exitCode = error.code;

      switch (exitCode) {
        case 1:
          throw new LLMError(
            LLMErrorType.VALIDATION,
            1,
            'Invalid request format',
            error.stderr || error.message
          );
        case 2:
          throw new LLMError(
            LLMErrorType.PROVIDER_UNAVAILABLE,
            2,
            'LMStudio provider unavailable',
            error.stderr || 'Ensure LMStudio is running on http://localhost:1234'
          );
        case 3:
          throw new LLMError(
            LLMErrorType.LLM_REQUEST_FAILED,
            3,
            'LLM request failed',
            error.stderr || error.message
          );
        case 4:
          throw new LLMError(
            LLMErrorType.UNEXPECTED,
            4,
            'Unexpected error in llm_call.py',
            error.stderr || error.message
          );
        default:
          // Unknown exit code
          throw new LLMError(
            LLMErrorType.SUBPROCESS_ERROR,
            exitCode,
            `Subprocess exited with unknown code ${exitCode}`,
            error.stderr || error.message
          );
      }
    }

    // Handle subprocess spawn errors (Python not found, script not found)
    if (error.errno === 'ENOENT' || error.code === 'ENOENT') {
      throw new LLMError(
        LLMErrorType.SUBPROCESS_ERROR,
        null,
        'Failed to spawn subprocess',
        `Check PYTHON_PATH (${PYTHON_PATH}) and LLM_CLI_PATH (${LLM_CLI_PATH}) are correct`
      );
    }

    // Generic subprocess error
    throw new LLMError(
      LLMErrorType.SUBPROCESS_ERROR,
      null,
      'Subprocess execution failed',
      error.message
    );
  }
}
