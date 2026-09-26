import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('LoginUseCase', () => {
  const userRepository = createMock<UserRepository>();
  const passwordHasher = createMock<PasswordHasher>();
  const tokenService = createMock<TokenService>();

  const useCase = new LoginUseCase(
    userRepository,
    passwordHasher,
    tokenService,
  );

  const user = new UserEntity(
    '1',
    'Juan',
    'juan@example.com',
    'hashed-password',
    'COLABORADOR',
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tokens and user when credentials are valid', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.generate.mockReturnValue('access-token');
    tokenService.generateRefresh.mockReturnValue('refresh-token');
    tokenService.expiresInSeconds.mockReturnValue(86400);

    const result = await useCase.execute({
      email: '  JUAN@EXAMPLE.COM ',
      password: 'Secret123*',
    });

    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(
      'juan@example.com',
    );
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'Secret123*',
      'hashed-password',
    );
    expect(tokenService.generate).toHaveBeenCalledWith('1', 'COLABORADOR');
    expect(tokenService.expiresInSeconds).toHaveBeenCalledWith('access-token');
    expect(tokenService.generateRefresh).toHaveBeenCalledWith(
      '1',
      'COLABORADOR',
    );
    expect(result).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 86400,
      user: {
        id: '1',
        fullName: 'Juan',
        email: 'juan@example.com',
        role: 'COLABORADOR',
        menu: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'dashboard',
            path: '/dashboard',
            description: 'Resumen general',
            isActive: true,
          },
          {
            id: 'perfil',
            label: 'Mi perfil',
            icon: 'user',
            path: '/perfil',
          },
        ],
      },
    });
  });

  it('throws UnauthorizedException when user does not exist', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'Secret123*' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when password is invalid', async () => {
    userRepository.findByEmailWithPassword.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'juan@example.com', password: 'bad-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user is inactive', async () => {
    const inactiveUser = new UserEntity(
      '1',
      'Juan',
      'juan@example.com',
      'hashed-password',
      'COLABORADOR',
      false,
    );
    userRepository.findByEmailWithPassword.mockResolvedValue(inactiveUser);
    passwordHasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: 'juan@example.com', password: 'Secret123*' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
