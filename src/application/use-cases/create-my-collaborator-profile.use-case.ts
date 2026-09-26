import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { consentFields } from '../../domain/entities/data-consent';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROGRAM_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CreateMyCollaboratorDto } from '../dto/create-my-collaborator.dto';
import { toCollaboratorProfileResponse } from '../mappers/collaborator-response.mapper';
import { findProgramOrFail } from '../support/catalog-references';
import { COLLABORATOR_PROFILE_NOT_FOUND } from '../support/my-collaborator';

@Injectable()
export class CreateMyCollaboratorProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
  ) {}

  async execute(userId: string, data: CreateMyCollaboratorDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ message: 'Usuario no encontrado' });
    }

    if (await this.collaboratorRepository.findByUserId(userId)) {
      throw new ConflictException({
        message: 'Ya tienes un perfil de colaborador',
      });
    }

    const existingByEmail = await this.collaboratorRepository.findByEmail(
      user.email,
    );
    if (existingByEmail?.userId) {
      throw new ConflictException({
        message: 'Este correo ya está vinculado a otra cuenta',
      });
    }

    // Si un administrador ya lo importó con ese correo, se vincula en lugar de duplicarlo.
    const collaborator = existingByEmail
      ? await this.collaboratorRepository.update(existingByEmail.id, {
          userId,
        })
      : await this.createProfile(userId, user.email, data);

    if (!collaborator) {
      throw new NotFoundException({ message: COLLABORATOR_PROFILE_NOT_FOUND });
    }

    return toCollaboratorProfileResponse(collaborator);
  }

  private async createProfile(
    userId: string,
    email: string,
    data: CreateMyCollaboratorDto,
  ) {
    await findProgramOrFail(this.programRepository, data.programId);

    return this.collaboratorRepository.create({
      email,
      userId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      personType: data.personType,
      programId: data.programId,
      semester: data.semester,
      researchGroup: data.researchGroup,
      summary: data.summary,
      profileUrl: data.profileUrl,
      ...consentFields(data.dataConsent ?? false),
      source: 'REGISTRO',
    });
  }
}
