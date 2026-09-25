import type { SkillCategory } from './skill-category.type';
import type { SkillStatus } from './skill-status.type';
import type { SkillType } from './skill-type.type';

export class SkillEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly normalizedName: string,
    public readonly type: SkillType,
    public readonly category: SkillCategory = 'OTRA',
    public readonly synonyms: string[] = [],
    public readonly status: SkillStatus = 'ACTIVA',
  ) {}
}
