import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NEED_KINDS, NEED_STATUSES } from '../../../domain/entities/need';
import { ProjectOrmEntity } from './project.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

// `numeric` llega como texto desde Postgres: se convierte a número al leer.
const numeric = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/** Necesidades institucionales (tesis, D1). */
@Entity({ name: 'needs' })
@Index(['createdById', 'createdAt'])
export class NeedOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: [...NEED_KINDS], enumName: 'need_kind' })
  kind: string;

  @Column({
    type: 'enum',
    enum: [...NEED_STATUSES],
    enumName: 'need_status',
    default: 'REGISTRADA',
  })
  status: string;

  @Column({ type: 'smallint' })
  urgency: number;

  @Column({ type: 'smallint' })
  impact: number;

  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  dependency: string | null;

  @Column({ type: 'jsonb', nullable: true })
  characterization: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  characterizedAt: Date | null;

  @Column({ type: 'smallint', default: 0 })
  completeness: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: numeric,
  })
  priorityScore: number;

  @OneToOne(() => ProjectOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'projectId' })
  project?: ProjectOrmEntity | null;

  @Column({ type: 'uuid', nullable: true, unique: true })
  projectId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  discardReason: string | null;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: UserOrmEntity;

  @Column('uuid')
  createdById: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
