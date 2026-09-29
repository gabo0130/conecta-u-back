import { ProgramEntity } from '../entities/program.entity';

export interface CreateProgramRepositoryDto {
  code: string;
  name: string;
  faculty?: string | null;
}

export interface UpdateProgramRepositoryDto {
  name?: string;
  faculty?: string | null;
  active?: boolean;
}

export interface ProgramRepository {
  findAll(onlyActive?: boolean): Promise<ProgramEntity[]>;
  findById(id: string): Promise<ProgramEntity | null>;
  findByCodeOrName(value: string): Promise<ProgramEntity | null>;
  create(data: CreateProgramRepositoryDto): Promise<ProgramEntity>;
  update(
    id: string,
    data: UpdateProgramRepositoryDto,
  ): Promise<ProgramEntity | null>;
}
