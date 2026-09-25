import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SKILL_CATEGORIES } from '../../../domain/entities/skill-category.type';
import { SKILL_STATUSES } from '../../../domain/entities/skill-status.type';
import { SKILL_TYPES } from '../../../domain/entities/skill-type.type';

@Entity({ name: 'skills' })
export class SkillOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  normalizedName: string;

  @Column({ type: 'enum', enum: [...SKILL_TYPES] })
  type: string;

  @Column({ type: 'enum', enum: [...SKILL_CATEGORIES], default: 'OTRA' })
  category: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  synonyms: string[];

  @Column({ type: 'enum', enum: [...SKILL_STATUSES], default: 'ACTIVA' })
  status: string;
}
