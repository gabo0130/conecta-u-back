import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ImportRejectedRow } from '../../../domain/entities/import-run.entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity({ name: 'import_runs' })
export class ImportRunOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'uuid', nullable: true })
  importedByUserId: string | null;

  // Auditoría: si se borra el admin, la corrida queda en el historial sin quien la subió.
  @ManyToOne(() => UserOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'importedByUserId' })
  importedBy?: UserOrmEntity | null;

  @Column({ type: 'int' })
  createdCount: number;

  @Column({ type: 'int' })
  rejectedCount: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  rejected: ImportRejectedRow[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  warnings: string[];

  @CreateDateColumn()
  createdAt: Date;
}
