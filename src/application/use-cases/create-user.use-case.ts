import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
} from '../../shared/interfaces/tokens';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(data: CreateUserDto) {
    const email = data.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new ConflictException({ message: 'Correo ya registrado' });
    }

    const role = data.role;
    const passwordHash = await this.passwordHasher.hash(data.password);

    const user = await this.userRepository.create({
      fullName: data.fullName.trim(),
      email,
      passwordHash,
      role,
      program: data.program ?? null,
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      program: user.program,
    };
  }
}
