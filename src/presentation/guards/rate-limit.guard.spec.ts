import { HttpException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

const contextFor = (ip: string) =>
  ({
    getHandler: () => () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        route: { path: '/api/auth/password/forgot' },
        ip,
      }),
    }),
  }) as unknown as ExecutionContext;

describe('RateLimitGuard', () => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'get').mockReturnValue({ limit: 2, windowMs: 60_000 });

  it('allows up to the limit per IP and then answers 429', () => {
    const guard = new RateLimitGuard(reflector);
    expect(guard.canActivate(contextFor('1.1.1.1'))).toBe(true);
    expect(guard.canActivate(contextFor('1.1.1.1'))).toBe(true);
    try {
      guard.canActivate(contextFor('1.1.1.1'));
      fail('debía lanzar 429');
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(429);
    }
    expect(guard.canActivate(contextFor('2.2.2.2'))).toBe(true);
  });

  it('lets the request pass when the route has no limit', () => {
    const plain = new Reflector();
    jest.spyOn(plain, 'get').mockReturnValue(undefined);
    expect(new RateLimitGuard(plain).canActivate(contextFor('1.1.1.1'))).toBe(
      true,
    );
  });
});
