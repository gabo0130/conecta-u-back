import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { LEVELS } from '../../../domain/entities/level.type';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Entity({ name: 'collaborator_skills' })
@Unique(['collaboratorId', 'skillId'])
export class CollaboratorSkillOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => CollaboratorOrmEntity,
    (collaborator) => collaborator.skills,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'collaboratorId' })
  collaborator: CollaboratorOrmEntity;

  @Column('uuid')
  collaboratorId: string;

  @ManyToOne(() => SkillOrmEntity, { eager: true })
  @JoinColumn({ name: 'skillId' })
  skill: SkillOrmEntity;

  @Column('uuid')
  skillId: string;

  @Column({ type: 'enum', enum: [...LEVELS] })
  level: string;

  @Column({ type: 'smallint' })
  experienceMonths: number;

  @Column({ type: 'smallint', nullable: true })
  lastUsedYear: number | null;
}
