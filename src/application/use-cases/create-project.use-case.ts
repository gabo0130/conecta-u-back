import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import {
  PROJECT_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { validateTypeData } from '../../shared/utils/validate-type-data';
import { CreateProjectDto } from '../dto/create-project.dto';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async execute(leaderId: string, data: CreateProjectDto) {
    const type = await this.projectTypeRepository.findById(data.typeId);
    if (!type) {
      throw new NotFoundException({
        message: 'Tipo de proyecto no encontrado',
      });
    }

    validateTypeData(type.templateFields, data.typeData ?? {});

    return this.projectRepository.create({
      title: data.title,
      summary: data.summary,
      objectives: data.objectives,
      typeId: data.typeId,
      categoryId: data.categoryId,
      programId: data.programId ?? null,
      typeData: data.typeData ?? {},
      knownSkillIds: data.knownSkillIds,
      deliverables: data.deliverables,
      leaderId,
    });
  }
}
