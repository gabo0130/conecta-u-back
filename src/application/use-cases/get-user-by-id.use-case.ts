import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      program: user.program,
    };
  }
}
