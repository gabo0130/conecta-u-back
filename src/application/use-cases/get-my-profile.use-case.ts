import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';

@Injectable()
export class GetMyProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ message: 'Usuario no encontrado' });
    }

    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    if (!collaborator) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      program: user.program,
      headline: collaborator.headline,
      studyGroup: collaborator.studyGroup,
      availabilityStatus: collaborator.availabilityStatus,
      weeklyHours: collaborator.weeklyHours,
      modality: collaborator.modality,
      skills: collaborator.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        type: skill.type,
        level: skill.level,
      })),
      experiences: collaborator.experiences.map((experience) => ({
        id: experience.id,
        title: experience.title,
        organization: experience.organization,
        period: experience.period,
        description: experience.description,
      })),
    };
  }
}
