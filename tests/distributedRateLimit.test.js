import { describe, it, expect } from 'vitest';
import { createDistributedAuthRateLimiterMiddleware } from '../server/distributedRateLimit.js';

describe('Rate Limiting Distribuído e Resiliente (distributedRateLimit)', () => {
  it('deve permitir requisições normais no middleware', async () => {
    const middleware = createDistributedAuthRateLimiterMiddleware();
    const req = {
      ip: '192.168.1.100',
      body: { email: 'usuario.teste@empresa.com' },
      headers: {},
      socket: {}
    };

    let nextCalled = false;
    const res = {
      status: () => res,
      json: () => res,
      setHeader: () => {}
    };
    const next = () => { nextCalled = true; };

    await middleware(req, res, next);
    expect(nextCalled).toBe(true);
  });

  it('deve lidar corretamente com IPs e cabeçalhos de proxy', async () => {
    const middleware = createDistributedAuthRateLimiterMiddleware();
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.195' },
      body: { email: 'motorista@logusq.com' },
      socket: {}
    };

    let nextCalled = false;
    const res = {
      status: () => res,
      json: () => res,
      setHeader: () => {}
    };
    const next = () => { nextCalled = true; };

    await middleware(req, res, next);
    expect(nextCalled).toBe(true);
  });
});
