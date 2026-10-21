import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CollaboratorEntity } from '../../../domain/entities/collaborator.entity';
import type { DocumentType } from '../../../domain/entities/person-identification';
import {
  CollaboratorRepository,
  CreateCollaboratorRepositoryDto,
  UpdateCollaboratorRepositoryDto,
} from '../../../domain/repositories/collaborator.repository.interface';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { toCollaboratorEntity } from './mappers/collaborator.mapper';
import { RecommendationOrmEntity } from './recommendation.orm-entity';
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

  async findByDocument(
    documentType: DocumentType,
    documentNumber: string,
  ): Promise<CollaboratorEntity | null> {
    const collaborator = await this.repository.findOne({
      where: { documentType, documentNumber },
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
      documentType: data.documentType ?? null,
      documentNumber: data.documentNumber ?? null,
      phone: data.phone ?? null,
      nationality: data.nationality ?? null,
      alternateEmail: data.alternateEmail ?? null,
      institutionalCode: data.institutionalCode ?? null,
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

    // merge() modifica `collaborator` en el lugar: el resumen anterior se guarda antes.
    const previousSummary = collaborator.summary;
    const merged = this.repository.merge(collaborator, pickDefined(data));
    // El resumen forma parte del texto del embedding (el resto de los campos, no).
    if (data.summary !== undefined && data.summary !== previousSummary) {
      merged.embeddingUpdatedAt = null;
    }

    const withdrawn = !merged.dataConsent || !merged.active;
    if (withdrawn) clearEmbedding(merged);

    const saved = await this.repository.manager.transaction(async (manager) => {
      const result = await manager.save(merged);
      // Ley 1581: sin consentimiento (o desactivada) no se sigue tratando su perfil: se borran
      // el vector derivado y las recomendaciones guardadas, no solo se ocultan.
      if (withdrawn) {
        await manager.delete(RecommendationOrmEntity, { collaboratorId: id });
      }
      return result;
    });
    return this.findById(saved.id);
  }
}

function clearEmbedding(collaborator: CollaboratorOrmEntity): void {
  collaborator.profileEmbedding = null;
  collaborator.embeddingModel = null;
  collaborator.embeddingUpdatedAt = null;
}
