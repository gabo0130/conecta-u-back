import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramEntity } from '../../../domain/entities/program.entity';
import type {
  CreateProgramRepositoryDto,
  UpdateProgramRepositoryDto,
} from '../../../domain/repositories/program.repository.interface';
import { ProgramRepository } from '../../../domain/repositories/program.repository.interface';
import { pickDefined } from '../../../shared/utils/pick-defined';
import { ProgramOrmEntity } from './program.orm-entity';

@Injectable()
export class TypeOrmProgramRepository implements ProgramRepository {
  constructor(
    @InjectRepository(ProgramOrmEntity)
    private readonly repository: Repository<ProgramOrmEntity>,
  ) {}

  async findAll(onlyActive = true): Promise<ProgramEntity[]> {
    const programs = await this.repository.find({
      where: onlyActive ? { active: true } : {},
      order: { name: 'ASC' },
    });
    return programs.map((program) => this.toDomain(program));
  }

  async findById(id: string): Promise<ProgramEntity | null> {
    const program = await this.repository.findOne({ where: { id } });
    return program ? this.toDomain(program) : null;
  }

  async findByCodeOrName(value: string): Promise<ProgramEntity | null> {
    // Comparación exacta sin distinguir mayúsculas: un `%` o `_` del Excel no actúa como comodín.
    const program = await this.repository
      .createQueryBuilder('program')
      .where('LOWER(program.code) = LOWER(:value)', { value })
      .orWhere('LOWER(program.name) = LOWER(:value)', { value })
      .getOne();
    return program ? this.toDomain(program) : null;
  }

  async create(data: CreateProgramRepositoryDto): Promise<ProgramEntity> {
    const program = this.repository.create({
      code: data.code,
      name: data.name,
      faculty: data.faculty ?? null,
    });
    const saved = await this.repository.save(program);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: UpdateProgramRepositoryDto,
  ): Promise<ProgramEntity | null> {
    const program = await this.repository.findOne({ where: { id } });
    if (!program) return null;

    const merged = this.repository.merge(program, pickDefined(data));
    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  private toDomain(program: ProgramOrmEntity): ProgramEntity {
    return new ProgramEntity(
      program.id,
      program.code,
      program.name,
      program.faculty,
      program.active,
    );
  }
}
