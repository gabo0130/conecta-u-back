import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
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
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import { TOKEN_SERVICE } from '../../shared/interfaces/tokens';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly registerUseCase: RegisterUseCase,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
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

  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const payload = this.tokenService.verifyRefresh(
      refreshTokenDto.refresh_token,
    );

    return {
      access_token: this.tokenService.generate(payload.userId, payload.role),
      expires_in: 604800,
    };
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
