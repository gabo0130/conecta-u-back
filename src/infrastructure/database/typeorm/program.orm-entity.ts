import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'programs' })
export class ProgramOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  faculty: string | null;

  @Column({ default: true })
  active: boolean;
}
