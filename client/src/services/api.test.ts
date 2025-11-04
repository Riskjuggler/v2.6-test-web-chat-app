import {
  ChatResponse,
  NetworkError,
  ValidationError,
  ServerError,
  ServiceUnavailableError,
} from '../types/api';

// Mock axios - using factory function pattern
const mockPost = jest.fn();
const mockIsAxiosError = jest.fn();

jest.mock('axios', () => {
  const mockPost = jest.fn();
  const mockIsAxiosError = jest.fn();

  return {
    __esModule: true,
    default: {
      create: () => ({
        post: mockPost,
      }),
      isAxiosError: mockIsAxiosError,
    },
    isAxiosError: mockIsAxiosError,
  };
});

// Import after mocking
import axios from 'axios';
import { sendMessage } from './api';

// Get reference to the mocked functions
const mockedAxios = axios as jest.Mocked<typeof axios>;
const axiosInstance = mockedAxios.create();
const post = axiosInstance.post as jest.Mock;
const isAxiosError = axios.isAxiosError as jest.Mock;

describe('API Client - sendMessage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should successfully send message and return response', async () => {
    const mockResponse: ChatResponse = {
      reply: 'Hello! How can I help you?',
      model: 'gpt-3.5-turbo',
      provider: 'openai',
    };

    post.mockResolvedValue({ data: mockResponse });

    const result = await sendMessage('Hello');

    expect(result).toEqual(mockResponse);
    expect(post).toHaveBeenCalledWith('/api/chat', {
      message: 'Hello',
    });
  });

  it('should throw NetworkError when no response is received', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: undefined,
    });
    isAxiosError.mockReturnValue(true);

    await expect(sendMessage('Hello')).rejects.toThrow(NetworkError);
    await expect(sendMessage('Hello')).rejects.toThrow(
      'Network error. Please check your connection.'
    );
  });

  it('should throw ValidationError for 400 Bad Request', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400 },
    });
    isAxiosError.mockReturnValue(true);

    await expect(sendMessage('')).rejects.toThrow(ValidationError);
    await expect(sendMessage('')).rejects.toThrow(
      'Invalid request. Please check your input.'
    );
  });

  it('should throw ServiceUnavailableError for 503 status', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 503 },
    });
    isAxiosError.mockReturnValue(true);

    await expect(sendMessage('Hello')).rejects.toThrow(
      ServiceUnavailableError
    );
    await expect(sendMessage('Hello')).rejects.toThrow(
      'Service temporarily unavailable. Please try again.'
    );
  });

  it('should throw ServerError for 500 Internal Server Error', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 500 },
    });
    isAxiosError.mockReturnValue(true);

    await expect(sendMessage('Hello')).rejects.toThrow(ServerError);
    await expect(sendMessage('Hello')).rejects.toThrow(
      'Server error. Please try again later.'
    );
  });

  it('should throw ServerError for other 5xx errors', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 502 },
    });
    isAxiosError.mockReturnValue(true);

    await expect(sendMessage('Hello')).rejects.toThrow(ServerError);
  });

  it('should handle timeout by throwing NetworkError', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      code: 'ECONNABORTED',
      response: undefined,
    });
    isAxiosError.mockReturnValue(true);

    await expect(sendMessage('Hello')).rejects.toThrow(NetworkError);
  });

  it('should send correct request payload structure', async () => {
    const testMessage = 'Test message';
    const mockResponse: ChatResponse = {
      reply: 'Response',
      model: 'test-model',
      provider: 'test-provider',
    };

    post.mockResolvedValue({ data: mockResponse });

    await sendMessage(testMessage);

    expect(post).toHaveBeenCalledWith('/api/chat', {
      message: testMessage,
    });
  });

  it('should correctly transform and return response data', async () => {
    const mockResponse: ChatResponse = {
      reply: 'Detailed response with multiple sentences.',
      model: 'gpt-4',
      provider: 'openai',
    };

    post.mockResolvedValue({ data: mockResponse });

    const result = await sendMessage('Complex question');

    expect(result).toHaveProperty('reply');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('provider');
    expect(result.reply).toBe(mockResponse.reply);
    expect(result.model).toBe(mockResponse.model);
    expect(result.provider).toBe(mockResponse.provider);
  });

  it('should throw ServerError for other HTTP error codes (e.g. 401)', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401 },
    });
    isAxiosError.mockReturnValue(true);

    await expect(sendMessage('Hello')).rejects.toThrow(ServerError);
    await expect(sendMessage('Hello')).rejects.toThrow('Server error: 401');
  });

  it('should throw NetworkError for non-Axios errors', async () => {
    post.mockRejectedValue(new Error('Some random error'));
    isAxiosError.mockReturnValue(false);

    await expect(sendMessage('Hello')).rejects.toThrow(NetworkError);
    await expect(sendMessage('Hello')).rejects.toThrow(
      'An unexpected error occurred'
    );
  });
});
