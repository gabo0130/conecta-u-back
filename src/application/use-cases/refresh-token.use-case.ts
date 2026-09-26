import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { TOKEN_SERVICE, USER_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string) {
    const { userId } = this.tokenService.verifyRefresh(refreshToken);
    const user = await this.userRepository.findById(userId);

    if (!user || !user.active) {
      throw new UnauthorizedException({ message: 'No autorizado' });
    }

    const accessToken = this.tokenService.generate(user.id, user.role);

    return {
      access_token: accessToken,
      expires_in: this.tokenService.expiresInSeconds(accessToken),
    };
  }
}
