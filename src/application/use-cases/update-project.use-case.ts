import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import {
  PROJECT_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { validateTypeData } from '../../shared/utils/validate-type-data';
import { UpdateProjectDto } from '../dto/update-project.dto';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async execute(leaderId: string, projectId: string, data: UpdateProjectDto) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    if (project.leaderId !== leaderId) {
      throw new ForbiddenException({ message: 'Prohibido' });
    }

    if (data.typeId !== undefined || data.typeData !== undefined) {
      const typeId = data.typeId ?? project.typeId;
      const type = await this.projectTypeRepository.findById(typeId);
      if (!type) {
        throw new NotFoundException({
          message: 'Tipo de proyecto no encontrado',
        });
      }
      validateTypeData(type.templateFields, data.typeData ?? project.typeData);
    }

    const updated = await this.projectRepository.update(projectId, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.objectives !== undefined ? { objectives: data.objectives } : {}),
      ...(data.typeId !== undefined ? { typeId: data.typeId } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.programId !== undefined ? { programId: data.programId } : {}),
      ...(data.typeData !== undefined ? { typeData: data.typeData } : {}),
      ...(data.knownSkillIds !== undefined
        ? { knownSkillIds: data.knownSkillIds }
        : {}),
      ...(data.deliverables !== undefined
        ? { deliverables: data.deliverables }
        : {}),
    });

    if (!updated) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return updated;
  }
}
