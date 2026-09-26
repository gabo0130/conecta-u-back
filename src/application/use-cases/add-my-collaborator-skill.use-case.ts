import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CollaboratorSkillDto } from '../dto/collaborator-skill.dto';
import { toCollaboratorSkillResponse } from '../mappers/collaborator-response.mapper';
import {
  DUPLICATED_SKILL,
  findMyCollaboratorOrFail,
} from '../support/my-collaborator';

@Injectable()
export class AddMyCollaboratorSkillUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(COLLABORATOR_SKILL_REPOSITORY)
    private readonly collaboratorSkillRepository: CollaboratorSkillRepository,
  ) {}

  async execute(userId: string, data: CollaboratorSkillDto) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );

    if (!(await this.skillRepository.findById(data.skillId))) {
      throw new NotFoundException({ message: 'Habilidad no encontrada' });
    }

    if (collaborator.skills.some((entry) => entry.skill.id === data.skillId)) {
      throw new ConflictException({ message: DUPLICATED_SKILL });
    }

    const created = await this.collaboratorSkillRepository.create({
      collaboratorId: collaborator.id,
      skillId: data.skillId,
      level: data.level,
      experienceMonths: data.experienceMonths,
      lastUsedYear: data.lastUsedYear ?? null,
    });

    return toCollaboratorSkillResponse(created);
  }
}
