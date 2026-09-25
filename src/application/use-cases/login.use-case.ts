import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { getMenuByRole } from '../../domain/entities/menu-catalog';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { LoginResponseDto } from '../dto/login-response.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(loginDto: LoginDto): Promise<LoginResponseDto> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user =
      await this.userRepository.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await this.passwordHasher.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException({ message: 'Credenciales inválidas' });
    }

    if (!user.active) {
      throw new UnauthorizedException({ message: 'Usuario inactivo' });
    }

    const accessToken = this.tokenService.generate(user.id, user.role);
    const refreshToken = this.tokenService.generateRefresh(user.id, user.role);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 604800,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        menu: getMenuByRole(user.role),
      },
    };
  }
}
