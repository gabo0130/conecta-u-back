import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  PROGRAM_REPOSITORY,
  PROJECT_CATEGORY_REPOSITORY,
  PROJECT_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { UpdateProjectDto } from '../dto/update-project.dto';
import {
  assertSkillsExist,
  findProgramOrFail,
  findProjectCategoryOrFail,
  findProjectTypeOrFail,
} from '../support/catalog-references';
import { assertValidTypeData } from '../support/project-references';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
    @Inject(PROJECT_CATEGORY_REPOSITORY)
    private readonly projectCategoryRepository: ProjectCategoryRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
  ) {}

  async execute(leaderId: string, projectId: string, data: UpdateProjectDto) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    if (project.leaderId !== leaderId) {
      throw new ForbiddenException({ message: 'Prohibido' });
    }

    await this.assertReferences(project, data);

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

  /** Verifica solo las referencias que cambian; el resto ya fue validado al crear. */
  private async assertReferences(
    project: ProjectEntity,
    data: UpdateProjectDto,
  ): Promise<void> {
    if (data.typeId !== undefined || data.typeData !== undefined) {
      const type = await findProjectTypeOrFail(
        this.projectTypeRepository,
        data.typeId ?? project.typeId,
      );
      assertValidTypeData(type, data.typeData ?? project.typeData);
    }
    if (data.categoryId !== undefined) {
      await findProjectCategoryOrFail(
        this.projectCategoryRepository,
        data.categoryId,
      );
    }
    if (data.programId !== undefined) {
      await findProgramOrFail(this.programRepository, data.programId);
    }
    await assertSkillsExist(this.skillRepository, data.knownSkillIds);
  }
}
