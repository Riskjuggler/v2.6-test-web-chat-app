const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockAxios: any = {
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn((error: any) => error && error.isAxiosError === true),
};

export default mockAxios;
