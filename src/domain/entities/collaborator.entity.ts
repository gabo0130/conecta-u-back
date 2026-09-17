import type { AvailabilityStatus } from './availability-status.type';
import type { ExperienceEntity } from './experience.entity';
import type { SkillEntity } from './skill.entity';

export class CollaboratorEntity {
  constructor(
    public readonly userId: string,
    public readonly headline: string | null,
    public readonly availabilityStatus: AvailabilityStatus,
    public readonly weeklyHours: string | null,
    public readonly modality: string | null,
    public readonly skills: SkillEntity[] = [],
    public readonly experiences: ExperienceEntity[] = [],
  ) {}
}
