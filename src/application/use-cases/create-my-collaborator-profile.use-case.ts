import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CreateMyCollaboratorDto } from '../dto/create-my-collaborator.dto';

@Injectable()
export class CreateMyCollaboratorProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string, data: CreateMyCollaboratorDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ message: 'Usuario no encontrado' });
    }

    const existingByUser =
      await this.collaboratorRepository.findByUserId(userId);
    if (existingByUser) {
      throw new ConflictException({
        message: 'Ya tienes un perfil de colaborador',
      });
    }

    const existingByEmail = await this.collaboratorRepository.findByEmail(
      user.email,
    );
    if (existingByEmail) {
      if (existingByEmail.userId) {
        throw new ConflictException({
          message: 'Este correo ya está vinculado a otra cuenta',
        });
      }
      return this.collaboratorRepository.update(existingByEmail.id, {
        userId,
      });
    }

    return this.collaboratorRepository.create({
      email: user.email,
      userId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      personType: data.personType,
      programId: data.programId,
      semester: data.semester,
      researchGroup: data.researchGroup,
      summary: data.summary,
      profileUrl: data.profileUrl,
      dataConsent: data.dataConsent ?? false,
      source: 'REGISTRO',
    });
  }
}
