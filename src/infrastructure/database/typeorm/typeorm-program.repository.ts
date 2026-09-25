import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ProgramEntity } from '../../../domain/entities/program.entity';
import { ProgramRepository } from '../../../domain/repositories/program.repository.interface';
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
    const program = await this.repository.findOne({
      where: [{ code: ILike(value) }, { name: ILike(value) }],
    });
    return program ? this.toDomain(program) : null;
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
