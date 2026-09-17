import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PROJECT_STATUSES } from '../../../domain/entities/project-status.type';
import { UserOrmEntity } from './user.orm-entity';

@Entity({ name: 'projects' })
export class ProjectOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  summary: string;

  @Column({ type: 'text', nullable: false })
  objectives: string;

  @Column({ type: 'simple-array', nullable: true })
  knownSkills: string[] | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  semillero: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  program: string | null;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leaderId' })
  leader: UserOrmEntity;

  @Column('uuid')
  leaderId: string;

  @Column({ type: 'enum', enum: [...PROJECT_STATUSES], default: 'BORRADOR' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
