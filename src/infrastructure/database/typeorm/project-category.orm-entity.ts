import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'project_categories' })
export class ProjectCategoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  name: string;

  @Column({ default: true })
  active: boolean;
}
