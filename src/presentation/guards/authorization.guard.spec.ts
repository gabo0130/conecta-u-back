import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationGuard } from './authorization.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { createMock } from '../../testing/test-doubles.testing';

const makeContext = (user?: AuthenticatedRequest['user']): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  }) as unknown as ExecutionContext;

describe('AuthorizationGuard', () => {
  const reflector = createMock<Reflector>();

  const guard = new AuthorizationGuard(reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when no authorization rule is defined', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('throws UnauthorizedException when user is missing', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue({
      anyOfRoles: ['ADMIN'],
    });

    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when role does not match', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue({
      anyOfRoles: ['ADMIN'],
    });

    expect(() =>
      guard.canActivate(makeContext({ userId: '1', role: 'LIDER' })),
    ).toThrow(ForbiddenException);
  });

  it('returns true when role matches', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue({
      anyOfRoles: ['ADMIN'],
    });

    expect(guard.canActivate(makeContext({ userId: '1', role: 'ADMIN' }))).toBe(
      true,
    );
  });
});
