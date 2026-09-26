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

  // orphanedRowAction va en este lado (ManyToOne): al quitar un entregable de project.deliverables
  // y guardar, TypeORM borra la fila en vez de intentar dejar projectId en NULL.
  @ManyToOne(() => ProjectOrmEntity, (project) => project.deliverables, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
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
