import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { RequiredProfileOrmEntity } from './required-profile.orm-entity';

// `numeric` llega como texto desde Postgres: se convierte a número al leer.
const numeric = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity({ name: 'recommendations' })
@Unique(['requiredProfileId', 'collaboratorId'])
export class RecommendationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'int' })
  rank: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numeric })
  score: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, transformer: numeric })
  skillScore: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, transformer: numeric })
  semanticScore: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, transformer: numeric })
  experienceScore: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, transformer: numeric })
  availabilityScore: number;

  @Column({ type: 'jsonb' })
  breakdown: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  generatedAt: Date;
}
