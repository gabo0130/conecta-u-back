import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { USER_ROLES } from '../../../domain/entities/user-role.type';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';

@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120, nullable: false })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    select: false,
    name: 'password_hash',
  })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: [...USER_ROLES],
    default: 'COLABORADOR',
  })
  role: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  program: string | null;

  @OneToOne(() => CollaboratorOrmEntity, (collaborator) => collaborator.user, {
    cascade: true,
    nullable: true,
  })
  collaborator?: CollaboratorOrmEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
