import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AVAILABILITY_STATUSES } from '../../../domain/entities/availability-status.type';
import { ExperienceOrmEntity } from './experience.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity({ name: 'collaborators' })
export class CollaboratorOrmEntity {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => UserOrmEntity, (user) => user.collaborator, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;

  @Column({ type: 'varchar', length: 160, nullable: true })
  headline: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  studyGroup: string | null;

  @Column({
    type: 'enum',
    enum: [...AVAILABILITY_STATUSES],
    default: 'DISPONIBLE',
  })
  availabilityStatus: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  weeklyHours: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  modality: string | null;

  @OneToMany(() => SkillOrmEntity, (skill) => skill.collaborator, {
    cascade: true,
  })
  skills: SkillOrmEntity[];

  @OneToMany(
    () => ExperienceOrmEntity,
    (experience) => experience.collaborator,
    {
      cascade: true,
    },
  )
  experiences: ExperienceOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
