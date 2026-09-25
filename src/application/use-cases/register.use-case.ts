import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(data: RegisterDto) {
    const email = data.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException({ message: 'Correo ya registrado' });
    }

    const existingCollaborator =
      data.role === 'COLABORADOR'
        ? await this.collaboratorRepository.findByEmail(email)
        : null;

    if (existingCollaborator?.userId) {
      throw new ConflictException({
        message: 'Este correo ya está vinculado a una cuenta',
      });
    }

    const passwordHash = await this.passwordHasher.hash(data.password);
    const user = await this.userRepository.create({
      fullName: data.fullName.trim(),
      email,
      passwordHash,
      role: data.role,
    });

    if (data.role === 'COLABORADOR' && data.collaborator) {
      if (existingCollaborator) {
        await this.collaboratorRepository.update(existingCollaborator.id, {
          userId: user.id,
        });
      } else {
        await this.collaboratorRepository.create({
          email,
          userId: user.id,
          firstName: data.collaborator.firstName.trim(),
          lastName: data.collaborator.lastName.trim(),
          personType: data.collaborator.personType,
          programId: data.collaborator.programId,
          source: 'REGISTRO',
        });
      }
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }
}
