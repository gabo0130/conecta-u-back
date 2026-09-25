import { ProgramEntity } from '../entities/program.entity';

export interface ProgramRepository {
  findAll(onlyActive?: boolean): Promise<ProgramEntity[]>;
  findById(id: string): Promise<ProgramEntity | null>;
  findByCodeOrName(value: string): Promise<ProgramEntity | null>;
}
