import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { UserEntity } from '../../domain/entities/user.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../domain/repositories/unit-of-work.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PASSWORD_HASHER,
  PROGRAM_REPOSITORY,
  UNIT_OF_WORK,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { RegisterCollaboratorDto, RegisterDto } from '../dto/register.dto';
import { findProgramOrFail } from '../support/catalog-references';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(data: RegisterDto) {
    const email = data.email.trim().toLowerCase();

    if (await this.userRepository.findByEmail(email)) {
      throw new ConflictException({ message: 'Correo ya registrado' });
    }

    const profile =
      data.role === 'COLABORADOR'
        ? await this.prepareCollaboratorProfile(email, data.collaborator)
        : null;

    const passwordHash = await this.passwordHasher.hash(data.password);

    // Usuario y perfil se escriben juntos: si falla el perfil no queda una cuenta huérfana.
    const user = await this.unitOfWork.run(async (repositories) => {
      const created = await repositories.users.create({
        fullName: data.fullName.trim(),
        email,
        passwordHash,
        role: data.role,
      });
      if (profile) {
        await this.linkCollaboratorProfile(repositories, created, profile);
      }
      return created;
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Decide, antes de escribir, si el colaborador se vincula a un perfil existente
   * (p. ej. importado desde Excel) o se crea uno nuevo con un programa válido.
   */
  private async prepareCollaboratorProfile(
    email: string,
    collaborator: RegisterCollaboratorDto | undefined,
  ): Promise<PendingProfile> {
    if (!collaborator) {
      throw new BadRequestException({
        message: 'Los datos del colaborador son obligatorios',
      });
    }

    const existing = await this.collaboratorRepository.findByEmail(email);
    if (existing?.userId) {
      throw new ConflictException({
        message: 'Este correo ya está vinculado a una cuenta',
      });
    }
    if (existing) {
      return { kind: 'link', existing };
    }

    await findProgramOrFail(this.programRepository, collaborator.programId);
    return { kind: 'create', email, collaborator };
  }

  private async linkCollaboratorProfile(
    repositories: TransactionalRepositories,
    user: UserEntity,
    profile: PendingProfile,
  ): Promise<void> {
    if (profile.kind === 'link') {
      await repositories.collaborators.update(profile.existing.id, {
        userId: user.id,
      });
      return;
    }

    await repositories.collaborators.create({
      email: profile.email,
      userId: user.id,
      firstName: profile.collaborator.firstName.trim(),
      lastName: profile.collaborator.lastName.trim(),
      personType: profile.collaborator.personType,
      programId: profile.collaborator.programId,
      source: 'REGISTRO',
    });
  }
}

type PendingProfile =
  | { kind: 'link'; existing: CollaboratorEntity }
  | { kind: 'create'; email: string; collaborator: RegisterCollaboratorDto };
