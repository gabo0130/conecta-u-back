import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { UserRole } from '../../domain/entities/user-role.type';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  PROGRAM_REPOSITORY,
  PROJECT_CATEGORY_REPOSITORY,
  PROJECT_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  SKILL_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CreateProjectDto } from '../dto/create-project.dto';
import {
  assertSkillsExist,
  findProgramOrFail,
  findProjectCategoryOrFail,
  findProjectTypeOrFail,
} from '../support/catalog-references';
import { assertValidTypeData } from '../support/project-references';
import { toProjectResponse } from '../mappers/project-response.mapper';

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
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(actor: ProjectAuthor, data: CreateProjectDto) {
    const leaderId = await this.resolveLeader(actor, data.leaderId);
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

    const project = await this.projectRepository.create({
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
      createdById: actor.userId,
    });
    return toProjectResponse(project);
  }

  /** El LIDER siempre es dueño de lo que registra; el ADMIN elige un líder activo. */
  private async resolveLeader(
    actor: ProjectAuthor,
    leaderId: string | undefined,
  ): Promise<string> {
    if (actor.role !== 'ADMIN') return actor.userId;
    if (!leaderId) {
      throw new UnprocessableEntityException({ message: LEADER_REQUIRED });
    }
    const leader = await this.userRepository.findById(leaderId);
    if (!leader || leader.role !== 'LIDER' || !leader.active) {
      throw new UnprocessableEntityException({ message: INVALID_LEADER });
    }
    return leader.id;
  }
}

export interface ProjectAuthor {
  userId: string;
  role: UserRole;
}

export const LEADER_REQUIRED = 'Elige el líder responsable del proyecto';
export const INVALID_LEADER =
  'El líder responsable debe ser un usuario activo con rol Líder';
