import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CERTIFICATE_MIME_TYPES } from '../../../domain/entities/experience-certificate';
import { ExperienceOrmEntity } from './experience.orm-entity';

/**
 * Certificado de una experiencia (v2.2, E8 / RT16). El archivo vive en un bucket privado
 * (`storageKey`); aquí solo quedan sus metadatos. `content` es el contenido de los certificados
 * subidos antes del bucket: no se selecciona por defecto y se vacía al migrarlos.
 */
@Entity({ name: 'experience_certificates' })
export class ExperienceCertificateOrmEntity {
  @PrimaryColumn('uuid')
  experienceId: string;

  @OneToOne(() => ExperienceOrmEntity, (experience) => experience.certificate, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'experienceId' })
  experience?: ExperienceOrmEntity;

  @Column({ type: 'varchar', length: 160 })
  fileName: string;

  @Column({
    type: 'enum',
    enum: [...CERTIFICATE_MIME_TYPES],
    enumName: 'certificate_mime_type',
  })
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  @Column({ type: 'varchar', length: 300, nullable: true })
  storageKey: string | null;

  @Column({ type: 'bytea', select: false, nullable: true })
  content?: Buffer | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  uploadedAt: Date;
}
