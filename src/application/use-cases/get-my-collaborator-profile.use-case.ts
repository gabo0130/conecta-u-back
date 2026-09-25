import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { computeDurationMonths } from '../../shared/utils/compute-duration-months';

@Injectable()
export class GetMyCollaboratorProfileUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string) {
    const collaborator = await this.collaboratorRepository.findByUserId(userId);
    if (!collaborator) {
      throw new NotFoundException({
        message: 'Perfil de colaborador no encontrado',
      });
    }

    return toCollaboratorProfileResponse(collaborator);
  }
}

export function toCollaboratorProfileResponse(
  collaborator: CollaboratorEntity,
) {
  return {
    id: collaborator.id,
    email: collaborator.email,
    firstName: collaborator.firstName,
    lastName: collaborator.lastName,
    personType: collaborator.personType,
    programId: collaborator.programId,
    semester: collaborator.semester,
    researchGroup: collaborator.researchGroup,
    summary: collaborator.summary,
    profileUrl: collaborator.profileUrl,
    availabilityStatus: collaborator.availabilityStatus,
    weeklyHours: collaborator.weeklyHours,
    dataConsent: collaborator.dataConsent,
    source: collaborator.source,
    skills: collaborator.skills.map((entry) => ({
      id: entry.id,
      skill: {
        id: entry.skill.id,
        name: entry.skill.name,
        type: entry.skill.type,
        category: entry.skill.category,
      },
      level: entry.level,
      experienceMonths: entry.experienceMonths,
      lastUsedYear: entry.lastUsedYear,
    })),
    experiences: collaborator.experiences.map((experience) => ({
      id: experience.id,
      type: experience.type,
      role: experience.role,
      organization: experience.organization,
      startDate: experience.startDate,
      endDate: experience.endDate,
      current: experience.current,
      weeklyHours: experience.weeklyHours,
      level: experience.level,
      description: experience.description,
      technologies: experience.technologies.map((skill) => ({
        id: skill.id,
        name: skill.name,
      })),
      durationMonths: computeDurationMonths(
        experience.startDate,
        experience.endDate,
      ),
    })),
  };
}
