import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';

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

  @Column({ type: 'varchar', length: 140, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 140, nullable: true })
  organization: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  period: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
