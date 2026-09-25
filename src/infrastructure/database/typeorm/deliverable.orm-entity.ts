import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';

@Entity({ name: 'deliverables' })
export class DeliverableOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProjectOrmEntity, (project) => project.deliverables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: ProjectOrmEntity;

  @Column('uuid')
  projectId: string;

  @Column({ type: 'varchar', length: 140 })
  name: string;

  @Column({ type: 'text' })
  scope: string;
}
