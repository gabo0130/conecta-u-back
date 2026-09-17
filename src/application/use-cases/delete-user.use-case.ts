import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const deleted = await this.userRepository.delete(userId);

    if (!deleted) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }
  }
}
