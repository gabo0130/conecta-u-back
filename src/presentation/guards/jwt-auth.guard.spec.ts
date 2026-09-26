import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { buildUser, createMock } from '../../testing/test-doubles.testing';

const makeContext = (
  request: Partial<AuthenticatedRequest>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  const tokenService = createMock<TokenService>();
  const userRepository = createMock<UserRepository>();
  const guard = new JwtAuthGuard(tokenService, userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.verify.mockReturnValue({ userId: 'user-1', role: 'ADMIN' });
  });

  it('rejects a request without bearer header', async () => {
    await expect(
      guard.canActivate(makeContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token whose user no longer exists', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        makeContext({ headers: { authorization: 'Bearer token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a deactivated user even with a valid token', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ active: false }));

    await expect(
      guard.canActivate(
        makeContext({ headers: { authorization: 'Bearer token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('uses the role stored in the database, not the one in the token', async () => {
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer token' },
    };
    userRepository.findById.mockResolvedValue(buildUser({ role: 'LIDER' }));

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user-1', role: 'LIDER' });
  });
});
