// API Types for chat endpoint communication

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  provider: string;
}

// Custom error classes for better error handling
export class NetworkError extends Error {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Invalid request. Please check your input.') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ServerError extends Error {
  constructor(message: string = 'Server error. Please try again later.') {
    super(message);
    this.name = 'ServerError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string = 'Service temporarily unavailable. Please try again.') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
