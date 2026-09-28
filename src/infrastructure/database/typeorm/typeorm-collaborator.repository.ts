import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CollaboratorEntity } from '../../../domain/entities/collaborator.entity';
import {
  CollaboratorRepository,
  CreateCollaboratorRepositoryDto,
  UpdateCollaboratorRepositoryDto,
} from '../../../domain/repositories/collaborator.repository.interface';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { toCollaboratorEntity } from './mappers/collaborator.mapper';
import { pickDefined } from '../../../shared/utils/pick-defined';
import type {
  Page,
  PageParams,
} from '../../../shared/pagination/pagination.util';
import { toSkip } from '../../../shared/pagination/pagination.util';

const RELATIONS = [
  'skills',
  'skills.skill',
  'experiences',
  'experiences.technologies',
];

@Injectable()
export class TypeOrmCollaboratorRepository implements CollaboratorRepository {
  constructor(
    @InjectRepository(CollaboratorOrmEntity)
    private readonly repository: Repository<CollaboratorOrmEntity>,
  ) {}

  async findById(id: string): Promise<CollaboratorEntity | null> {
    const collaborator = await this.repository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    return collaborator ? toCollaboratorEntity(collaborator) : null;
  }

  async findByUserId(userId: string): Promise<CollaboratorEntity | null> {
    const collaborator = await this.repository.findOne({
      where: { userId },
      relations: RELATIONS,
    });
    return collaborator ? toCollaboratorEntity(collaborator) : null;
  }

  async findByUserIds(userIds: string[]): Promise<CollaboratorEntity[]> {
    if (userIds.length === 0) return [];
    const collaborators = await this.repository.find({
      where: { userId: In(userIds) },
      relations: RELATIONS,
    });
    return collaborators.map(toCollaboratorEntity);
  }

  async findAll(params: PageParams): Promise<Page<CollaboratorEntity>> {
    const [collaborators, total] = await this.repository.findAndCount({
      order: { firstName: 'ASC', lastName: 'ASC' },
      relations: RELATIONS,
      skip: toSkip(params.page, params.pageSize),
      take: params.pageSize,
    });
    return { items: collaborators.map(toCollaboratorEntity), total };
  }

  async findByEmail(email: string): Promise<CollaboratorEntity | null> {
    const collaborator = await this.repository.findOne({
      where: { email },
      relations: RELATIONS,
    });
    return collaborator ? toCollaboratorEntity(collaborator) : null;
  }

  async create(
    data: CreateCollaboratorRepositoryDto,
  ): Promise<CollaboratorEntity> {
    const collaborator = this.repository.create({
      email: data.email,
      userId: data.userId ?? null,
      firstName: data.firstName,
      lastName: data.lastName,
      personType: data.personType,
      programId: data.programId,
      semester: data.semester ?? null,
      researchGroup: data.researchGroup ?? null,
      summary: data.summary ?? null,
      profileUrl: data.profileUrl ?? null,
      availabilityStatus: data.availabilityStatus ?? 'DISPONIBLE',
      weeklyHours: data.weeklyHours ?? 0,
      dataConsent: data.dataConsent ?? false,
      dataConsentAt: data.dataConsentAt ?? null,
      source: data.source ?? 'REGISTRO',
    });

    const saved = await this.repository.save(collaborator);
    return this.findById(saved.id) as Promise<CollaboratorEntity>;
  }

  async update(
    id: string,
    data: UpdateCollaboratorRepositoryDto,
  ): Promise<CollaboratorEntity | null> {
    const collaborator = await this.repository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!collaborator) {
      return null;
    }

    const merged = this.repository.merge(collaborator, pickDefined(data));

    const saved = await this.repository.save(merged);
    return this.findById(saved.id);
  }
}
