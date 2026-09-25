import type { ExperienceType } from './experience-type.type';
import type { Level } from './level.type';
import { SkillEntity } from './skill.entity';

export class ExperienceEntity {
  constructor(
    public readonly id: string,
    public readonly collaboratorId: string,
    public readonly type: ExperienceType,
    public readonly role: string,
    public readonly organization: string,
    public readonly startDate: string,
    public readonly endDate: string | null,
    public readonly current: boolean,
    public readonly weeklyHours: number,
    public readonly level: Level,
    public readonly description: string | null = null,
    public readonly technologies: SkillEntity[] = [],
  ) {}
}
