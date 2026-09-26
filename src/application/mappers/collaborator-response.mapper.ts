import type { CollaboratorSkillEntity } from '../../domain/entities/collaborator-skill.entity';
import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { ExperienceEntity } from '../../domain/entities/experience.entity';
import { computeDurationMonths } from '../../shared/utils/compute-duration-months';

// Única forma de respuesta del perfil técnico: la usan GET, POST y PATCH de /collaborators/me*.

export function toCollaboratorSkillResponse(entry: CollaboratorSkillEntity) {
  return {
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
  };
}

export function toExperienceResponse(experience: ExperienceEntity) {
  return {
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
  };
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
    skills: collaborator.skills.map(toCollaboratorSkillResponse),
    experiences: collaborator.experiences.map(toExperienceResponse),
  };
}
