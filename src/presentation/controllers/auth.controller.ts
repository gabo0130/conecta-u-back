import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { LoginResponseDto } from '../../application/dto/login-response.dto';
import { LoginDto } from '../../application/dto/login.dto';
import type { LogoutResponseDto } from '../../application/dto/logout-response.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetTokenDto,
} from '../../application/dto/password-reset.dto';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { RateLimit, RateLimitGuard } from '../guards/rate-limit.guard';

const MINUTE_MS = 60_000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @HttpCode(201)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.registerUseCase.execute(registerDto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUseCase.execute(loginDto);
  }

  /** Siempre la misma respuesta (200), exista o no la cuenta. */
  @HttpCode(200)
  @Post('password/forgot')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 5, windowMs: 15 * MINUTE_MS })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.requestPasswordResetUseCase.execute(dto.email);
  }

  @HttpCode(200)
  @Post('password/reset/check')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 20, windowMs: 15 * MINUTE_MS })
  checkResetToken(@Body() dto: ResetTokenDto) {
    return this.resetPasswordUseCase.check(dto.token);
  }

  @HttpCode(200)
  @Post('password/reset')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 10, windowMs: 15 * MINUTE_MS })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto.token, dto.password);
  }

  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(refreshTokenDto.refresh_token);
  }

  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(): LogoutResponseDto {
    return { message: 'Logout successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    const userId = request.user?.userId;

    if (userId === undefined) {
      throw new UnauthorizedException({
        message: 'Token no válido o expirado',
      });
    }

    return this.getMeUseCase.execute(userId);
  }
}
