import axios, { AxiosError } from 'axios';
import {
  ChatRequest,
  ChatResponse,
  NetworkError,
  ValidationError,
  ServerError,
  ServiceUnavailableError,
} from '../types/api';

// Create axios instance with configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000, // 30 seconds to handle LLM response delays
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send a message to the chat API and get a response
 * @param message - The message to send
 * @returns Promise with the chat response
 * @throws NetworkError - For network connectivity issues
 * @throws ValidationError - For 400 Bad Request errors
 * @throws ServiceUnavailableError - For 503 Service Unavailable errors
 * @throws ServerError - For other server errors (500, etc.)
 */
export async function sendMessage(message: string): Promise<ChatResponse> {
  try {
    const payload: ChatRequest = { message };
    const response = await apiClient.post<ChatResponse>('/api/chat', payload);
    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network error (no response received)
      if (!axiosError.response) {
        throw new NetworkError();
      }

      // Handle specific HTTP status codes
      const status = axiosError.response.status;

      if (status === 400) {
        throw new ValidationError();
      } else if (status === 503) {
        throw new ServiceUnavailableError();
      } else if (status >= 500) {
        throw new ServerError();
      }

      // Other HTTP errors
      throw new ServerError(`Server error: ${status}`);
    }

    // Unknown error type
    throw new NetworkError('An unexpected error occurred');
  }
}
