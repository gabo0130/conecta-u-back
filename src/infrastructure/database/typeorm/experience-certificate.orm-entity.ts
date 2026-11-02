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
 * Certificado de una experiencia (v2.2, E8 / RT16). El contenido vive en la base (bytea) y no
 * en el disco: Render borra el disco en cada despliegue. `content` no se selecciona por
 * defecto, así cargar perfiles no trae los archivos.
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

  @Column({ type: 'bytea', select: false })
  content?: Buffer;

  @UpdateDateColumn({ type: 'timestamptz' })
  uploadedAt: Date;
}
