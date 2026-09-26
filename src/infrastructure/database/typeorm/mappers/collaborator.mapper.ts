import { CollaboratorSkillEntity } from '../../../../domain/entities/collaborator-skill.entity';
import { CollaboratorEntity } from '../../../../domain/entities/collaborator.entity';
import { ExperienceEntity } from '../../../../domain/entities/experience.entity';
import { CollaboratorSkillOrmEntity } from '../collaborator-skill.orm-entity';
import { CollaboratorOrmEntity } from '../collaborator.orm-entity';
import { ExperienceOrmEntity } from '../experience.orm-entity';
import { toSkillEntity } from './skill.mapper';

export function toCollaboratorSkillEntity(
  entry: CollaboratorSkillOrmEntity,
): CollaboratorSkillEntity {
  return new CollaboratorSkillEntity(
    entry.id,
    entry.collaboratorId,
    toSkillEntity(entry.skill),
    entry.level as CollaboratorSkillEntity['level'],
    entry.experienceMonths,
    entry.lastUsedYear,
  );
}

export function toExperienceEntity(
  experience: ExperienceOrmEntity,
): ExperienceEntity {
  return new ExperienceEntity({
    id: experience.id,
    collaboratorId: experience.collaboratorId,
    type: experience.type as ExperienceEntity['type'],
    role: experience.role,
    organization: experience.organization,
    startDate: experience.startDate,
    endDate: experience.endDate,
    current: experience.current,
    weeklyHours: experience.weeklyHours,
    level: experience.level as ExperienceEntity['level'],
    description: experience.description,
    technologies: (experience.technologies ?? []).map(toSkillEntity),
  });
}

export function toCollaboratorEntity(
  collaborator: CollaboratorOrmEntity,
): CollaboratorEntity {
  return new CollaboratorEntity({
    id: collaborator.id,
    email: collaborator.email,
    userId: collaborator.userId,
    firstName: collaborator.firstName,
    lastName: collaborator.lastName,
    personType: collaborator.personType as CollaboratorEntity['personType'],
    programId: collaborator.programId,
    semester: collaborator.semester,
    researchGroup: collaborator.researchGroup,
    summary: collaborator.summary,
    profileUrl: collaborator.profileUrl,
    availabilityStatus:
      collaborator.availabilityStatus as CollaboratorEntity['availabilityStatus'],
    weeklyHours: collaborator.weeklyHours,
    dataConsent: collaborator.dataConsent,
    dataConsentAt: collaborator.dataConsentAt,
    source: collaborator.source as CollaboratorEntity['source'],
    active: collaborator.active,
    skills: (collaborator.skills ?? []).map(toCollaboratorSkillEntity),
    experiences: (collaborator.experiences ?? []).map(toExperienceEntity),
  });
}
