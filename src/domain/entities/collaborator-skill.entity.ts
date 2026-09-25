import type { Level } from './level.type';
import { SkillEntity } from './skill.entity';

export class CollaboratorSkillEntity {
  constructor(
    public readonly id: string,
    public readonly collaboratorId: string,
    public readonly skill: SkillEntity,
    public readonly level: Level,
    public readonly experienceMonths: number,
    public readonly lastUsedYear: number | null = null,
  ) {}
}
