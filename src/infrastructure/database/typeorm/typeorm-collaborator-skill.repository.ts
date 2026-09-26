import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollaboratorSkillEntity } from '../../../domain/entities/collaborator-skill.entity';
import {
  CollaboratorSkillRepository,
  CreateCollaboratorSkillRepositoryDto,
  UpdateCollaboratorSkillRepositoryDto,
} from '../../../domain/repositories/collaborator-skill.repository.interface';
import { CollaboratorSkillOrmEntity } from './collaborator-skill.orm-entity';
import { toCollaboratorSkillEntity } from './mappers/collaborator.mapper';

@Injectable()
export class TypeOrmCollaboratorSkillRepository implements CollaboratorSkillRepository {
  constructor(
    @InjectRepository(CollaboratorSkillOrmEntity)
    private readonly repository: Repository<CollaboratorSkillOrmEntity>,
  ) {}

  async findById(id: string): Promise<CollaboratorSkillEntity | null> {
    const entry = await this.repository.findOne({ where: { id } });
    return entry ? toCollaboratorSkillEntity(entry) : null;
  }

  async findByCollaboratorId(
    collaboratorId: string,
  ): Promise<CollaboratorSkillEntity[]> {
    const entries = await this.repository.find({ where: { collaboratorId } });
    return entries.map(toCollaboratorSkillEntity);
  }

  async create(
    data: CreateCollaboratorSkillRepositoryDto,
  ): Promise<CollaboratorSkillEntity> {
    const entry = this.repository.create({
      collaboratorId: data.collaboratorId,
      skillId: data.skillId,
      level: data.level,
      experienceMonths: data.experienceMonths,
      lastUsedYear: data.lastUsedYear ?? null,
    });

    const saved = await this.repository.save(entry);
    const withSkill = await this.repository.findOne({
      where: { id: saved.id },
    });
    return toCollaboratorSkillEntity(withSkill ?? saved);
  }

  async update(
    id: string,
    data: UpdateCollaboratorSkillRepositoryDto,
  ): Promise<CollaboratorSkillEntity | null> {
    const entry = await this.repository.findOne({ where: { id } });
    if (!entry) {
      return null;
    }

    const merged = this.repository.merge(entry, {
      ...(data.skillId !== undefined ? { skillId: data.skillId } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.experienceMonths !== undefined
        ? { experienceMonths: data.experienceMonths }
        : {}),
      ...(data.lastUsedYear !== undefined
        ? { lastUsedYear: data.lastUsedYear }
        : {}),
    });

    const saved = await this.repository.save(merged);
    const withSkill = await this.repository.findOne({
      where: { id: saved.id },
    });
    return toCollaboratorSkillEntity(withSkill ?? saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
