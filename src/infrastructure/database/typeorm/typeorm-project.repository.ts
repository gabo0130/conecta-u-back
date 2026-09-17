import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../../domain/entities/project.entity';
import {
  CreateProjectRepositoryDto,
  ProjectRepository,
  UpdateProjectRepositoryDto,
} from '../../../domain/repositories/project.repository.interface';
import { ProjectOrmEntity } from './project.orm-entity';

@Injectable()
export class TypeOrmProjectRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly repository: Repository<ProjectOrmEntity>,
  ) {}

  async findById(id: string): Promise<ProjectEntity | null> {
    const project = await this.repository.findOne({ where: { id } });
    return project ? this.toDomain(project) : null;
  }

  async findByLeaderId(leaderId: string): Promise<ProjectEntity[]> {
    const projects = await this.repository.find({
      where: { leaderId },
      order: { createdAt: 'DESC' },
    });
    return projects.map((project) => this.toDomain(project));
  }

  async create(data: CreateProjectRepositoryDto): Promise<ProjectEntity> {
    const project = this.repository.create({
      title: data.title,
      summary: data.summary,
      objectives: data.objectives,
      knownSkills: data.knownSkills ?? null,
      semillero: data.semillero ?? null,
      program: data.program ?? null,
      leaderId: data.leaderId,
      status: 'BORRADOR',
    });

    const saved = await this.repository.save(project);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: UpdateProjectRepositoryDto,
  ): Promise<ProjectEntity | null> {
    const project = await this.repository.findOne({ where: { id } });
    if (!project) {
      return null;
    }

    const merged = this.repository.merge(project, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.objectives !== undefined ? { objectives: data.objectives } : {}),
      ...(data.knownSkills !== undefined
        ? { knownSkills: data.knownSkills }
        : {}),
      ...(data.semillero !== undefined ? { semillero: data.semillero } : {}),
      ...(data.program !== undefined ? { program: data.program } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    });

    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  private toDomain(project: ProjectOrmEntity): ProjectEntity {
    return new ProjectEntity(
      project.id,
      project.title,
      project.summary,
      project.objectives,
      project.knownSkills,
      project.semillero,
      project.program,
      project.leaderId,
      project.status as ProjectEntity['status'],
      project.createdAt,
      project.updatedAt,
    );
  }
}
