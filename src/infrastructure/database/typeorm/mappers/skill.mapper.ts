import { SkillEntity } from '../../../../domain/entities/skill.entity';
import { SkillOrmEntity } from '../skill.orm-entity';

export function toSkillEntity(skill: SkillOrmEntity): SkillEntity {
  return new SkillEntity(
    skill.id,
    skill.name,
    skill.normalizedName,
    skill.type as SkillEntity['type'],
    skill.category as SkillEntity['category'],
    skill.synonyms,
    skill.status as SkillEntity['status'],
  );
}
