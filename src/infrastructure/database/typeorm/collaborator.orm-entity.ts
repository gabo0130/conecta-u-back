import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AVAILABILITY_STATUSES } from '../../../domain/entities/availability-status.type';
import { COLLABORATOR_SOURCES } from '../../../domain/entities/collaborator-source.type';
import { PERSON_TYPES } from '../../../domain/entities/person-type.type';
import { CollaboratorSkillOrmEntity } from './collaborator-skill.orm-entity';
import { ExperienceOrmEntity } from './experience.orm-entity';
import { ProgramOrmEntity } from './program.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity({ name: 'collaborators' })
export class CollaboratorOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column('uuid', { nullable: true, unique: true })
  userId: string | null;

  @OneToOne(() => UserOrmEntity, (user) => user.collaborator, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity | null;

  @Column({ type: 'varchar', length: 80 })
  firstName: string;

  @Column({ type: 'varchar', length: 80 })
  lastName: string;

  @Column({ type: 'enum', enum: [...PERSON_TYPES] })
  personType: string;

  @ManyToOne(() => ProgramOrmEntity)
  @JoinColumn({ name: 'programId' })
  program: ProgramOrmEntity;

  @Column('uuid')
  programId: string;

  @Column({ type: 'smallint', nullable: true })
  semester: number | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  researchGroup: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'varchar', nullable: true })
  profileUrl: string | null;

  @Column({
    type: 'enum',
    enum: [...AVAILABILITY_STATUSES],
    default: 'DISPONIBLE',
  })
  availabilityStatus: string;

  @Column({ type: 'smallint', default: 0 })
  weeklyHours: number;

  @Column({ default: false })
  dataConsent: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  dataConsentAt: Date | null;

  @Column({
    type: 'enum',
    enum: [...COLLABORATOR_SOURCES],
    default: 'REGISTRO',
  })
  source: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => CollaboratorSkillOrmEntity, (skill) => skill.collaborator, {
    cascade: true,
  })
  skills: CollaboratorSkillOrmEntity[];

  @OneToMany(
    () => ExperienceOrmEntity,
    (experience) => experience.collaborator,
    { cascade: true },
  )
  experiences: ExperienceOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
