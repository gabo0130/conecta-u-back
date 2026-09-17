import type { SkillType } from './skill-type.type';

export class SkillEntity {
  constructor(
    public readonly id: string,
    public readonly collaboratorId: string,
    public readonly name: string,
    public readonly type: SkillType,
    public readonly level: string | null = null,
  ) {}
}
