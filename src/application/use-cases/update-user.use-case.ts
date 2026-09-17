import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../shared/interfaces/tokens';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, data: UpdateUserDto) {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    const normalizedEmail = data.email?.trim().toLowerCase();
    if (normalizedEmail && normalizedEmail !== existing.email) {
      const userByEmail =
        await this.userRepository.findByEmail(normalizedEmail);
      if (userByEmail && userByEmail.id !== userId) {
        throw new ConflictException({ message: 'Correo ya registrado' });
      }
    }

    const updated = await this.userRepository.update(userId, {
      ...(data.fullName !== undefined
        ? { fullName: data.fullName.trim() }
        : {}),
      ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.program !== undefined ? { program: data.program } : {}),
    });

    if (!updated) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role,
      program: updated.program,
    };
  }
}
