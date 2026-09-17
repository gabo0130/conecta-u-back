import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SKILL_TYPES } from '../../../domain/entities/skill-type.type';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';

@Entity({ name: 'skills' })
export class SkillOrmEntity {
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

  @Column({ type: 'varchar', length: 80, nullable: false })
  name: string;

  @Column({ type: 'enum', enum: [...SKILL_TYPES], default: 'CONOCIMIENTO' })
  type: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  level: string | null;
}
