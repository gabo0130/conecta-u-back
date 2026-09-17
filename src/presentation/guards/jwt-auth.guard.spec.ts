import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserEntity } from '../../domain/entities/user.entity';
import type { ExecutionContext } from '@nestjs/common';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { AuthenticatedRequest } from './jwt-auth.guard';

const makeContext = (authorization?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  const tokenService: jest.Mocked<Pick<TokenService, 'verify'>> = {
    verify: jest.fn(),
  };

  const userRepository: jest.Mocked<Pick<UserRepository, 'findById'>> = {
    findById: jest.fn(),
  };

  const guard = new JwtAuthGuard(tokenService, userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws UnauthorizedException when bearer header is missing', async () => {
    await expect(
      guard.canActivate(makeContext(undefined)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when token user does not exist', async () => {
    tokenService.verify.mockReturnValue({ userId: 10 });
    userRepository.findById.mockResolvedValue(null);

    await expect(
      guard.canActivate(makeContext('Bearer token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sets request.user and returns true when token is valid', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
    } as AuthenticatedRequest;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    tokenService.verify.mockReturnValue({ userId: 1 });
    userRepository.findById.mockResolvedValue(
      new UserEntity(1, 'A', 'a@example.com', 'x', 'Admin'),
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 1, role: 'Admin' });
  });
});
