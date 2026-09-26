import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { buildUser, createMock } from '../../testing/test-doubles.testing';

describe('RefreshTokenUseCase', () => {
  const userRepository = createMock<UserRepository>();
  const tokenService = createMock<TokenService>();
  const useCase = new RefreshTokenUseCase(userRepository, tokenService);

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.verifyRefresh.mockReturnValue({ userId: 'user-1' });
    tokenService.generate.mockReturnValue('access');
    tokenService.expiresInSeconds.mockReturnValue(86400);
  });

  it('issues a new access token with the role stored in the database', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ role: 'LIDER' }));

    await expect(useCase.execute('refresh')).resolves.toEqual({
      access_token: 'access',
      expires_in: 86400,
    });
    expect(tokenService.generate).toHaveBeenCalledWith('user-1', 'LIDER');
  });

  it('rejects an inactive user', async () => {
    userRepository.findById.mockResolvedValue(buildUser({ active: false }));

    await expect(useCase.execute('refresh')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it('rejects a user that no longer exists', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('refresh')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
