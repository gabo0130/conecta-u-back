import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import type { LoginDto } from '../../application/dto/login.dto';
import type { RegisterDto } from '../../application/dto/register.dto';
import type { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import type { LoginUseCase } from '../../application/use-cases/login.use-case';
import type { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import type { RegisterUseCase } from '../../application/use-cases/register.use-case';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { createMock } from '../../testing/test-doubles.testing';

describe('AuthController', () => {
  const loginUseCase = createMock<LoginUseCase>();
  const getMeUseCase = createMock<GetMeUseCase>();
  const registerUseCase = createMock<RegisterUseCase>();
  const refreshTokenUseCase = createMock<RefreshTokenUseCase>();

  const controller = new AuthController(
    loginUseCase,
    getMeUseCase,
    registerUseCase,
    refreshTokenUseCase,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates register to its use case', () => {
    const dto: RegisterDto = {
      fullName: 'Laura',
      email: 'laura@example.com',
      password: 'Secret123*',
      role: 'LIDER',
    };

    void controller.register(dto);

    expect(registerUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates login to its use case', () => {
    const dto: LoginDto = { email: 'a@example.com', password: 'Secret123*' };

    void controller.login(dto);

    expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('delegates refresh to its use case', () => {
    void controller.refresh({ refresh_token: 'refresh' });

    expect(refreshTokenUseCase.execute).toHaveBeenCalledWith('refresh');
  });

  it('throws UnauthorizedException when request user is missing in getMe', () => {
    expect(() => controller.getMe({} as AuthenticatedRequest)).toThrow(
      UnauthorizedException,
    );
  });

  it('delegates getMe to its use case', () => {
    void controller.getMe({
      user: { userId: 'user-1', role: 'ADMIN' },
    } as AuthenticatedRequest);

    expect(getMeUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('returns a success message on logout', () => {
    expect(controller.logout()).toEqual({ message: 'Logout successful' });
  });
});
