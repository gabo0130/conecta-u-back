import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequiredProfileOrmEntity } from './required-profile.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Entity({ name: 'required_profile_skills' })
export class RequiredProfileSkillOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RequiredProfileOrmEntity, (profile) => profile.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requiredProfileId' })
  requiredProfile?: RequiredProfileOrmEntity;

  @Column('uuid')
  requiredProfileId: string;

  // null: la IA propuso algo que no está en el catálogo (se muestra como "no catalogada").
  @ManyToOne(() => SkillOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'skillId' })
  skill?: SkillOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  skillId: string | null;

  @Column({ type: 'varchar', length: 80 })
  rawName: string;

  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ type: 'varchar', length: 12 })
  minLevel: string;

  @Column({ type: 'varchar', length: 10 })
  importance: string;
}
