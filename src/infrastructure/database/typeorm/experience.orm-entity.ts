import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EXPERIENCE_TYPES } from '../../../domain/entities/experience-type.type';
import { LEVELS } from '../../../domain/entities/level.type';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Entity({ name: 'experiences' })
export class ExperienceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => CollaboratorOrmEntity,
    (collaborator) => collaborator.experiences,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'collaboratorId' })
  collaborator: CollaboratorOrmEntity;

  @Column('uuid')
  collaboratorId: string;

  @Column({ type: 'enum', enum: [...EXPERIENCE_TYPES] })
  type: string;

  @Column({ type: 'varchar', length: 120 })
  role: string;

  @Column({ type: 'varchar', length: 160 })
  organization: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ default: false })
  current: boolean;

  @Column({ type: 'smallint' })
  weeklyHours: number;

  @Column({ type: 'enum', enum: [...LEVELS] })
  level: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToMany(() => SkillOrmEntity)
  @JoinTable({
    name: 'experience_skills',
    joinColumn: { name: 'experienceId' },
    inverseJoinColumn: { name: 'skillId' },
  })
  technologies: SkillOrmEntity[];
}
