/**
 * Chat API Route
 *
 * POST /api/chat endpoint that:
 * - Validates user message (required, non-empty)
 * - Calls LLM service from WU-010
 * - Maps LLM errors to appropriate HTTP status codes
 * - Returns formatted response {reply, model, provider}
 */

import { Router, Request, Response } from 'express';
import { callLLM } from '../services/llm';
import { LLMError, LLMErrorType } from '../types/llm';

const router = Router();

/**
 * POST /api/chat
 *
 * Request body: { message: string }
 * Response: { reply: string, model: string, provider: string }
 *
 * Status codes:
 * - 200: Success
 * - 400: Bad request (missing or empty message)
 * - 500: LLM service error
 * - 503: LLM provider unavailable
 * - 504: Request timeout
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    // Extract message from request body
    const { message } = req.body;

    // Validate message exists
    if (message === undefined || message === null) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message field is required',
      });
    }

    // Validate message is a string
    if (typeof message !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message must be a string',
      });
    }

    // Validate message is not empty after trimming
    if (message.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message cannot be empty',
      });
    }

    // Call LLM service
    const result = await callLLM(message);

    // Return success response
    return res.status(200).json({
      reply: result.reply,
      model: result.model,
      provider: result.provider,
    });
  } catch (error) {
    // Handle LLM-specific errors
    if (error instanceof LLMError) {
      // Map error type to HTTP status code
      switch (error.type) {
        case LLMErrorType.PROVIDER_UNAVAILABLE:
          return res.status(503).json({
            error: 'Service Unavailable',
            message: 'LLM provider is not available. Please ensure LMStudio is running.',
          });

        case LLMErrorType.TIMEOUT:
          return res.status(504).json({
            error: 'Gateway Timeout',
            message: 'LLM request timed out. Please try again.',
          });

        case LLMErrorType.VALIDATION:
        case LLMErrorType.PARSE_ERROR:
        case LLMErrorType.LLM_REQUEST_FAILED:
        case LLMErrorType.UNEXPECTED:
        case LLMErrorType.SUBPROCESS_ERROR:
        default:
          // Log technical details for debugging
          console.error('LLM Error:', {
            type: error.type,
            exitCode: error.exitCode,
            message: error.message,
            details: error.details,
          });

          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process your message. Please try again.',
          });
      }
    }

    // Handle unexpected non-LLMError exceptions
    console.error('Unexpected error in chat route:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred. Please try again.',
    });
  }
});

export default router;
