import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { TemplateField } from '../../../domain/entities/template-field.type';

@Entity({ name: 'project_types' })
export class ProjectTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  templateFields: TemplateField[];

  @Column({ default: true })
  active: boolean;
}
