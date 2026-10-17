import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectAnalysisOrmEntity } from './project-analysis.orm-entity';
import { ProjectOrmEntity } from './project.orm-entity';
import { RequiredProfileSkillOrmEntity } from './required-profile-skill.orm-entity';

/** Dimensión de la columna `vector`: si cambia, hace falta una migración. */
export const EMBEDDING_COLUMN_DIMENSIONS = 768;

@Entity({ name: 'required_profiles' })
export class RequiredProfileOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: ProjectOrmEntity;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => ProjectAnalysisOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'analysisId' })
  analysis?: ProjectAnalysisOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  analysisId: string | null;

  @Column({ type: 'varchar', length: 10 })
  source: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  justification: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 10 })
  priority: string;

  @Column({ type: 'int', nullable: true })
  minWeeklyHours: number | null;

  @Column({ type: 'int' })
  position: number;

  // `select: false`: el vector pesa y solo lo lee el matchmaking.
  @Column({
    type: 'vector',
    length: EMBEDDING_COLUMN_DIMENSIONS,
    nullable: true,
    select: false,
  })
  embedding?: number[] | null;

  /** Modelo que generó `embedding`: vectores de otro modelo no se comparan. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  embeddingModel: string | null;

  @Column({ default: true })
  active: boolean;

  @OneToMany(
    () => RequiredProfileSkillOrmEntity,
    (skill) => skill.requiredProfile,
    {
      cascade: true,
    },
  )
  skills: RequiredProfileSkillOrmEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
