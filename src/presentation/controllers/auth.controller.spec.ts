import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import type { CreateUserDto } from '../../application/dto/create-user.dto';
import type { LoginUseCase } from '../../application/use-cases/login.use-case';
import type { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import type { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import type { LoginDto } from '../../application/dto/login.dto';
import type { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

describe('AuthController', () => {
  const loginUseCase: jest.Mocked<Pick<LoginUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const getMeUseCase: jest.Mocked<Pick<GetMeUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const createUserUseCase: jest.Mocked<Pick<CreateUserUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const tokenService: jest.Mocked<
    Pick<TokenService, 'generate' | 'verifyRefresh'>
  > = {
    generate: jest.fn(),
    verifyRefresh: jest.fn(),
  };

  const controller = new AuthController(
    loginUseCase,
    getMeUseCase,
    createUserUseCase,
    tokenService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates register to use case', () => {
    const dto: CreateUserDto = {
      fullName: 'Ana',
      email: 'ana@example.com',
      password: 'Secret123*',
      role: 'COLABORADOR',
    };

    void controller.register(dto);

    expect(createUserUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates login to use case', async () => {
    loginUseCase.execute.mockResolvedValue({ token: 'x' });

    const dto: LoginDto = { email: 'a@example.com', password: 'Secret123*' };
    await expect(controller.login(dto)).resolves.toEqual({ token: 'x' });
    expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('throws UnauthorizedException when request user is missing in getMe', () => {
    expect(() => controller.getMe({} as AuthenticatedRequest)).toThrow(
      UnauthorizedException,
    );
  });

  it('delegates getMe to use case', async () => {
    getMeUseCase.execute.mockResolvedValue({ id: 1 });

    await expect(
      controller.getMe({
        user: { userId: 1, role: 'ADMIN' },
      } as AuthenticatedRequest),
    ).resolves.toEqual({ id: 1 });
    expect(getMeUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('refreshes the access token', () => {
    tokenService.verifyRefresh.mockReturnValue({
      userId: 1,
      role: 'COLABORADOR',
    });
    tokenService.generate.mockReturnValue('new-access-token');

    const dto: RefreshTokenDto = {
      refresh_token: 'a-valid-refresh-token-value',
    };

    expect(controller.refresh(dto)).toEqual({
      access_token: 'new-access-token',
      expires_in: 604800,
    });
    expect(tokenService.verifyRefresh).toHaveBeenCalledWith(dto.refresh_token);
    expect(tokenService.generate).toHaveBeenCalledWith(1, 'COLABORADOR');
  });

  it('returns a success message on logout', () => {
    expect(controller.logout()).toEqual({ message: 'Logout successful' });
  });
});
