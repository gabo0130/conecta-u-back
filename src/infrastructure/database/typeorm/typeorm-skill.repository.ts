import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillEntity } from '../../../domain/entities/skill.entity';
import {
  CreateSkillRepositoryDto,
  SkillRepository,
  UpdateSkillRepositoryDto,
} from '../../../domain/repositories/skill.repository.interface';
import { SkillOrmEntity } from './skill.orm-entity';

@Injectable()
export class TypeOrmSkillRepository implements SkillRepository {
  constructor(
    @InjectRepository(SkillOrmEntity)
    private readonly repository: Repository<SkillOrmEntity>,
  ) {}

  async findById(id: string): Promise<SkillEntity | null> {
    const skill = await this.repository.findOne({ where: { id } });
    return skill ? this.toDomain(skill) : null;
  }

  async findByCollaboratorId(collaboratorId: string): Promise<SkillEntity[]> {
    const skills = await this.repository.find({ where: { collaboratorId } });
    return skills.map((skill) => this.toDomain(skill));
  }

  async create(data: CreateSkillRepositoryDto): Promise<SkillEntity> {
    const skill = this.repository.create({
      collaboratorId: data.collaboratorId,
      name: data.name,
      type: data.type,
      level: data.level ?? null,
    });

    const saved = await this.repository.save(skill);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: UpdateSkillRepositoryDto,
  ): Promise<SkillEntity | null> {
    const skill = await this.repository.findOne({ where: { id } });
    if (!skill) {
      return null;
    }

    const merged = this.repository.merge(skill, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
    });

    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toDomain(skill: SkillOrmEntity): SkillEntity {
    return new SkillEntity(
      skill.id,
      skill.collaboratorId,
      skill.name,
      skill.type as SkillEntity['type'],
      skill.level,
    );
  }
}
