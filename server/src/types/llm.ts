/**
 * LLM Type Definitions
 *
 * Types for LLM service request/response handling and error classification
 */

/**
 * LLM Request Format
 * Matches llm_call.py expected input format
 */
export interface LLMRequest {
  provider: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
}

/**
 * LLM Response Format
 * Matches llm_call.py output format (OpenAI-compatible)
 */
export interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  model: string;
  provider: string;
}

/**
 * Simplified LLM Result
 * Returned to API callers after extracting relevant fields
 */
export interface LLMResult {
  reply: string;
  model: string;
  provider: string;
}

/**
 * LLM Error Types
 * Maps to llm_call.py exit codes for proper error handling
 */
export enum LLMErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  LLM_REQUEST_FAILED = 'LLM_REQUEST_FAILED',
  UNEXPECTED = 'UNEXPECTED_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  SUBPROCESS_ERROR = 'SUBPROCESS_ERROR',
}

/**
 * Custom LLM Error Class
 * Includes exit code and user-friendly message
 */
export class LLMError extends Error {
  constructor(
    public type: LLMErrorType,
    public exitCode: number | null,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
