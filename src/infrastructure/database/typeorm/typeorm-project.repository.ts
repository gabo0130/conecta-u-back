import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DeliverableEntity } from '../../../domain/entities/deliverable.entity';
import { ProjectEntity } from '../../../domain/entities/project.entity';
import { SkillEntity } from '../../../domain/entities/skill.entity';
import {
  CreateProjectRepositoryDto,
  DeliverableInput,
  ProjectRepository,
  UpdateProjectRepositoryDto,
} from '../../../domain/repositories/project.repository.interface';
import { DeliverableOrmEntity } from './deliverable.orm-entity';
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

  async findByLeaderId(leaderId: string): Promise<ProjectEntity[]> {
    const projects = await this.repository.find({
      where: { leaderId },
      order: { createdAt: 'DESC' },
      relations: RELATIONS,
    });
    return projects.map((project) => this.toDomain(project));
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

    const knownSkills =
      data.knownSkillIds !== undefined
        ? await this.resolveSkills(data.knownSkillIds)
        : project.knownSkills;

    const deliverables =
      data.deliverables !== undefined
        ? this.toDeliverableOrm(data.deliverables)
        : project.deliverables;

    const merged = this.repository.merge(project, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.objectives !== undefined ? { objectives: data.objectives } : {}),
      ...(data.typeId !== undefined ? { typeId: data.typeId } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.programId !== undefined ? { programId: data.programId } : {}),
      ...(data.typeData !== undefined ? { typeData: data.typeData } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      knownSkills,
      deliverables,
    });

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
    return new ProjectEntity(
      project.id,
      project.title,
      project.summary,
      project.objectives,
      project.typeId,
      project.categoryId,
      project.programId,
      project.typeData,
      (project.knownSkills ?? []).map(
        (skill) =>
          new SkillEntity(
            skill.id,
            skill.name,
            skill.normalizedName,
            skill.type as SkillEntity['type'],
            skill.category as SkillEntity['category'],
            skill.synonyms,
            skill.status as SkillEntity['status'],
          ),
      ),
      (project.deliverables ?? []).map(
        (deliverable) =>
          new DeliverableEntity(
            deliverable.id,
            deliverable.projectId,
            deliverable.name,
            deliverable.scope,
          ),
      ),
      project.leaderId,
      project.status as ProjectEntity['status'],
      project.createdAt,
      project.updatedAt,
    );
  }
}
