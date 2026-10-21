import type { CollaboratorSkillEntity } from '../../domain/entities/collaborator-skill.entity';
import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { ExperienceEntity } from '../../domain/entities/experience.entity';
import { isIdentificationComplete } from '../../domain/entities/person-identification';
import { computeDurationMonths } from '../../shared/utils/compute-duration-months';
import { toSkillSummary } from './skill-response.mapper';

// Única forma de respuesta del perfil técnico: la usan GET, POST y PATCH de /collaborators/me* y el
// detalle del ADMIN. Incluye identificación y contacto: NUNCA usarla en respuestas para el líder.

export function toCollaboratorSkillResponse(entry: CollaboratorSkillEntity) {
  return {
    id: entry.id,
    skill: toSkillSummary(entry.skill),
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
    ...toIdentificationResponse(collaborator),
    skills: collaborator.skills.map(toCollaboratorSkillResponse),
    experiences: collaborator.experiences.map(toExperienceResponse),
  };
}

/** Identificación y contacto (v2.1): solo para la propia persona y el ADMIN (RNF5, Ley 1581). */
export function toIdentificationResponse(collaborator: CollaboratorEntity) {
  return {
    documentType: collaborator.documentType,
    documentNumber: collaborator.documentNumber,
    phone: collaborator.phone,
    nationality: collaborator.nationality,
    alternateEmail: collaborator.alternateEmail,
    institutionalCode: collaborator.institutionalCode,
    identificationComplete: isIdentificationComplete(collaborator),
  };
}
