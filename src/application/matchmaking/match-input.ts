import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { ExperienceType } from '../../domain/entities/experience-type.type';
import type { RequiredProfileEntity } from '../../domain/entities/required-profile.entity';
import type {
  PersonSpec,
  RequiredProfileSpec,
} from '../../domain/services/match-score';
import { computeDurationMonths } from '../../shared/utils/compute-duration-months';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';

/** Tipo de experiencia que equivale al tipo de proyecto, para la bonificación (§5 del contrato). */
const EXPERIENCE_TYPE_BY_PROJECT_TYPE: Record<string, ExperienceType> = {
  INVESTIGACION: 'SEMILLERO_INVESTIGACION',
};

export const projectExperienceType = (
  projectTypeCode: string | null,
): ExperienceType | null =>
  (projectTypeCode && EXPERIENCE_TYPE_BY_PROJECT_TYPE[projectTypeCode]) || null;

export function toProfileSpec(
  profile: RequiredProfileEntity,
  embedding: number[] | null,
): RequiredProfileSpec {
  return {
    skills: profile.skills.map((skill) => {
      const name = skill.skillName ?? skill.rawName;
      return {
        skillId: skill.skillId,
        name,
        normalizedName: normalizeSkillName(name),
        minLevel: skill.minLevel,
        importance: skill.importance,
      };
    }),
    minWeeklyHours: profile.minWeeklyHours,
    embedding,
  };
}

export function toPersonSpec(
  collaborator: CollaboratorEntity,
  embedding: number[] | null,
  now = new Date(),
): PersonSpec {
  return {
    skills: collaborator.skills.map((entry) => ({
      skillId: entry.skill.id,
      normalizedNames: [
        normalizeSkillName(entry.skill.name),
        ...entry.skill.synonyms.map(normalizeSkillName),
      ],
      level: entry.level,
      months: entry.experienceMonths,
    })),
    experiences: collaborator.experiences.map((experience) => ({
      type: experience.type,
      label: `${experience.role} – ${experience.organization}`,
      months: computeDurationMonths(
        experience.startDate,
        experience.endDate,
        now,
      ),
      skillIds: experience.technologies.map((technology) => technology.id),
    })),
    availabilityStatus: collaborator.availabilityStatus,
    weeklyHours: collaborator.weeklyHours,
    embedding,
  };
}
