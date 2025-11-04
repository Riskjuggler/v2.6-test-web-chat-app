import request from 'supertest';
import { app } from '../index';

describe('API Health Endpoint', () => {
  it('should return 200 OK for health check', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('ok');
  });

  it('should return JSON content type', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['content-type']).toMatch(/json/);
  });
});
