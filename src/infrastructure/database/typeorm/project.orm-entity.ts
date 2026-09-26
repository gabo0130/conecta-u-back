import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PROJECT_STATUSES } from '../../../domain/entities/project-status.type';
import { DeliverableOrmEntity } from './deliverable.orm-entity';
import { ProgramOrmEntity } from './program.orm-entity';
import { ProjectCategoryOrmEntity } from './project-category.orm-entity';
import { ProjectTypeOrmEntity } from './project-type.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';
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

  @ManyToOne(() => ProjectTypeOrmEntity, { eager: true })
  @JoinColumn({ name: 'typeId' })
  type: ProjectTypeOrmEntity;

  @Column('uuid')
  typeId: string;

  @ManyToOne(() => ProjectCategoryOrmEntity, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: ProjectCategoryOrmEntity;

  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => ProgramOrmEntity, { nullable: true })
  @JoinColumn({ name: 'programId' })
  program: ProgramOrmEntity | null;

  @Column('uuid', { nullable: true })
  programId: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  typeData: Record<string, unknown>;

  @ManyToMany(() => SkillOrmEntity)
  @JoinTable({
    name: 'project_skills',
    joinColumn: { name: 'projectId' },
    inverseJoinColumn: { name: 'skillId' },
  })
  knownSkills: SkillOrmEntity[];

  @OneToMany(() => DeliverableOrmEntity, (deliverable) => deliverable.project, {
    cascade: true,
  })
  deliverables: DeliverableOrmEntity[];

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
