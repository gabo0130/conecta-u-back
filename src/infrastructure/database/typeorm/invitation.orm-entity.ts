import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { INVITATION_STATUSES } from '../../../domain/entities/invitation';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { ProjectOrmEntity } from './project.orm-entity';
import { RequiredProfileOrmEntity } from './required-profile.orm-entity';

/** Historial de convocatorias por correo (RF22). */
@Entity({ name: 'invitations' })
@Index(['projectId', 'sentAt'])
export class InvitationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project?: ProjectOrmEntity;

  @Column('uuid')
  projectId: string;

  // Si la persona se borra, el historial se conserva con el nombre guardado.
  @ManyToOne(() => CollaboratorOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator?: CollaboratorOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  collaboratorId: string | null;

  @ManyToOne(() => RequiredProfileOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requiredProfileId' })
  requiredProfile?: RequiredProfileOrmEntity | null;

  @Column({ type: 'uuid', nullable: true })
  requiredProfileId: string | null;

  @Column('uuid')
  sentById: string;

  @Column({ type: 'varchar', length: 200 })
  recipientName: string;

  @Column({ type: 'varchar', length: 254 })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  profileName: string | null;

  @Column({
    type: 'enum',
    enum: [...INVITATION_STATUSES],
    enumName: 'invitation_status',
  })
  status: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  sentAt: Date;
}
