const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

const axios: any = {
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn((error: any) => error && error.isAxiosError === true),
  ...mockAxiosInstance,
};

export default axios;
export { mockAxiosInstance };
