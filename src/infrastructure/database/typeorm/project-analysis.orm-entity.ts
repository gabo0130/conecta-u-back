import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity({ name: 'project_analyses' })
export class ProjectAnalysisOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: ProjectOrmEntity;

  @Column('uuid')
  projectId: string;

  // Auditoría: si se borra la cuenta, el análisis queda en el historial sin quien lo pidió.
  @ManyToOne(() => UserOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requestedById' })
  requestedBy?: UserOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  requestedById: string | null;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'varchar', length: 60 })
  model: string;

  @Column({ type: 'varchar', length: 20 })
  promptVersion: string;

  @Column({ type: 'jsonb' })
  input: Record<string, unknown>;

  @Column({ type: 'int', nullable: true })
  inputTokens: number | null;

  @Column({ type: 'int', nullable: true })
  outputTokens: number | null;

  @Column({ type: 'jsonb', nullable: true })
  rawOutput: unknown;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'int', nullable: true })
  durationMs: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
