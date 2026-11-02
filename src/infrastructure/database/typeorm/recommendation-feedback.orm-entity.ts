import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { FEEDBACK_DECISIONS } from '../../../domain/entities/recommendation-feedback';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { ProjectOrmEntity } from './project.orm-entity';
import { RequiredProfileOrmEntity } from './required-profile.orm-entity';

// `numeric` llega como texto desde Postgres: se convierte a número al leer.
const numeric = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/** Aceptar o descartar a una persona recomendada (tesis, D6). No depende de `recommendations`. */
@Entity({ name: 'recommendation_feedback' })
@Unique(['requiredProfileId', 'collaboratorId'])
@Index(['projectId'])
export class RecommendationFeedbackOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: ProjectOrmEntity;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => RequiredProfileOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requiredProfileId' })
  requiredProfile?: RequiredProfileOrmEntity;

  @Column('uuid')
  requiredProfileId: string;

  @ManyToOne(() => CollaboratorOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator?: CollaboratorOrmEntity;

  @Column('uuid')
  collaboratorId: string;

  @Column({
    type: 'enum',
    enum: [...FEEDBACK_DECISIONS],
    enumName: 'feedback_decision',
  })
  decision: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  @Column({ type: 'int' })
  rankAtDecision: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numeric })
  scoreAtDecision: number;

  @Column('uuid')
  decidedById: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  decidedAt: Date;
}
