import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { getMenuByRole } from '../../domain/entities/menu-catalog';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../shared/interfaces/tokens';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException({ message: 'Usuario no encontrado' });
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      program: user.program,
      menu: getMenuByRole(user.role),
    };
  }
}
