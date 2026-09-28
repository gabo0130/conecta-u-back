import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../shared/interfaces/tokens';
import {
  type SessionUserResponse,
  toSessionUserResponse,
} from '../mappers/user-response.mapper';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<SessionUserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException({ message: 'Usuario no encontrado' });
    }

    return toSessionUserResponse(user);
  }
}
