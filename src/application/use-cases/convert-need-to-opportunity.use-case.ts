import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work.interface';
import { NEED_REPOSITORY, UNIT_OF_WORK } from '../../shared/interfaces/tokens';
import { CreateProjectDto } from '../dto/create-project.dto';
import { toNeedResponse } from '../mappers/need-response.mapper';
import { toProjectResponse } from '../mappers/project-response.mapper';
import { loadOpenOwnedNeed, NEED_CLOSED_MESSAGE } from '../support/need-access';
import { CreateProjectUseCase } from './create-project.use-case';

/**
 * Tesis (T5): el formulador convierte su necesidad en una oportunidad. Recibe el mismo cuerpo
 * que `POST /projects` (el front lo precarga desde la caracterización), crea el proyecto con
 * las mismas validaciones y enlaza la necesidad, en una sola transacción. El proyecto sigue el
 * flujo normal de análisis y recomendación.
 */
@Injectable()
export class ConvertNeedToOpportunityUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    private readonly createProject: CreateProjectUseCase,
  ) {}

  async execute(userId: string, needId: string, data: CreateProjectDto) {
    await loadOpenOwnedNeed(this.needRepository, userId, needId);
    const projectData = await this.createProject.prepare(
      { userId, role: 'LIDER' },
      data,
    );
    const { project, need } = await this.unitOfWork.run(
      async ({ projects, needs }) => {
        const created = await projects.create(projectData);
        const converted = await needs.markConverted(needId, created.id);
        // Si otra petición la convirtió o descartó entre la lectura y aquí, nada queda escrito.
        if (!converted) {
          throw new ConflictException({ message: NEED_CLOSED_MESSAGE });
        }
        return { project: created, need: converted };
      },
    );
    return { need: toNeedResponse(need), project: toProjectResponse(project) };
  }
}
