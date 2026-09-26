import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DeliverableEntity } from '../../../domain/entities/deliverable.entity';
import { ProjectEntity } from '../../../domain/entities/project.entity';
import {
  CreateProjectRepositoryDto,
  DeliverableInput,
  ProjectRepository,
  UpdateProjectRepositoryDto,
} from '../../../domain/repositories/project.repository.interface';
import { DeliverableOrmEntity } from './deliverable.orm-entity';
import { toSkillEntity } from './mappers/skill.mapper';
import { pickDefined } from '../../../shared/utils/pick-defined';
import type { Page, PageParams } from '../../../shared/pagination/pagination.util';
import { toSkip } from '../../../shared/pagination/pagination.util';
import { ProjectOrmEntity } from './project.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

const RELATIONS = ['knownSkills', 'deliverables'];

@Injectable()
export class TypeOrmProjectRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectOrmEntity)
    private readonly repository: Repository<ProjectOrmEntity>,
    @InjectRepository(SkillOrmEntity)
    private readonly skillRepository: Repository<SkillOrmEntity>,
  ) {}

  async findById(id: string): Promise<ProjectEntity | null> {
    const project = await this.repository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    return project ? this.toDomain(project) : null;
  }

  async findByLeaderId(
    leaderId: string,
    params: PageParams,
  ): Promise<Page<ProjectEntity>> {
    const [projects, total] = await this.repository.findAndCount({
      where: { leaderId },
      order: { createdAt: 'DESC' },
      relations: RELATIONS,
      skip: toSkip(params.page, params.pageSize),
      take: params.pageSize,
    });
    return { items: projects.map((project) => this.toDomain(project)), total };
  }

  async findAll(params: PageParams): Promise<Page<ProjectEntity>> {
    const [projects, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      relations: RELATIONS,
      skip: toSkip(params.page, params.pageSize),
      take: params.pageSize,
    });
    return { items: projects.map((project) => this.toDomain(project)), total };
  }

  async create(data: CreateProjectRepositoryDto): Promise<ProjectEntity> {
    const knownSkills = await this.resolveSkills(data.knownSkillIds);

    const project = this.repository.create({
      title: data.title,
      summary: data.summary,
      objectives: data.objectives,
      typeId: data.typeId,
      categoryId: data.categoryId,
      programId: data.programId ?? null,
      typeData: data.typeData ?? {},
      knownSkills,
      deliverables: this.toDeliverableOrm(data.deliverables),
      leaderId: data.leaderId,
      status: 'BORRADOR',
    });

    const saved = await this.repository.save(project);
    return this.findById(saved.id) as Promise<ProjectEntity>;
  }

  async update(
    id: string,
    data: UpdateProjectRepositoryDto,
  ): Promise<ProjectEntity | null> {
    const project = await this.repository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!project) {
      return null;
    }

    const { knownSkillIds, deliverables, ...columns } = data;
    const merged = this.repository.merge(project, pickDefined(columns));

    // Las relaciones se asignan fuera de merge(): merge combina los arreglos por posición con los
    // cargados de la BD, así que conservaba habilidades quitadas y reinsertaba todos los entregables
    // (duplicados en cada PATCH). Asignadas directo, TypeORM reemplaza la lista: las habilidades
    // quitadas salen de la tabla puente y los entregables viejos se borran (orphanedRowAction).
    if (knownSkillIds !== undefined) {
      merged.knownSkills = await this.resolveSkills(knownSkillIds);
    }
    if (deliverables !== undefined) {
      merged.deliverables = this.toDeliverableOrm(deliverables);
    }

    const saved = await this.repository.save(merged);
    return this.findById(saved.id);
  }

  private toDeliverableOrm(
    deliverables: DeliverableInput[],
  ): DeliverableOrmEntity[] {
    return deliverables.map((deliverable) =>
      this.repository.manager
        .getRepository(DeliverableOrmEntity)
        .create({ name: deliverable.name, scope: deliverable.scope }),
    );
  }

  private async resolveSkills(ids?: string[]): Promise<SkillOrmEntity[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.skillRepository.find({ where: { id: In(ids) } });
  }

  private toDomain(project: ProjectOrmEntity): ProjectEntity {
    return new ProjectEntity({
      id: project.id,
      title: project.title,
      summary: project.summary,
      objectives: project.objectives,
      typeId: project.typeId,
      categoryId: project.categoryId,
      programId: project.programId,
      typeData: project.typeData,
      knownSkills: (project.knownSkills ?? []).map(toSkillEntity),
      deliverables: (project.deliverables ?? []).map(
        (deliverable) =>
          new DeliverableEntity(
            deliverable.id,
            deliverable.projectId,
            deliverable.name,
            deliverable.scope,
          ),
      ),
      leaderId: project.leaderId,
      status: project.status as ProjectEntity['status'],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  }
}
