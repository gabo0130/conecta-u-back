import { Inject, Injectable } from '@nestjs/common';
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
import { CreateProjectDto } from '../dto/create-project.dto';
import {
  assertSkillsExist,
  findProgramOrFail,
  findProjectCategoryOrFail,
  findProjectTypeOrFail,
} from '../support/catalog-references';
import { assertValidTypeData } from '../support/project-references';

@Injectable()
export class CreateProjectUseCase {
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

  async execute(leaderId: string, data: CreateProjectDto) {
    const typeData = data.typeData ?? {};
    const type = await findProjectTypeOrFail(
      this.projectTypeRepository,
      data.typeId,
    );
    assertValidTypeData(type, typeData);
    await findProjectCategoryOrFail(
      this.projectCategoryRepository,
      data.categoryId,
    );
    if (data.programId) {
      await findProgramOrFail(this.programRepository, data.programId);
    }
    await assertSkillsExist(this.skillRepository, data.knownSkillIds);

    return this.projectRepository.create({
      title: data.title,
      summary: data.summary,
      objectives: data.objectives,
      typeId: data.typeId,
      categoryId: data.categoryId,
      programId: data.programId ?? null,
      typeData,
      knownSkillIds: data.knownSkillIds,
      deliverables: data.deliverables,
      leaderId,
    });
  }
}
