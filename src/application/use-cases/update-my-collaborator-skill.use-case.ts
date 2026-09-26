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
export class UpdateMyCollaboratorSkillUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(COLLABORATOR_SKILL_REPOSITORY)
    private readonly collaboratorSkillRepository: CollaboratorSkillRepository,
  ) {}

  async execute(userId: string, id: string, data: CollaboratorSkillDto) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );

    // Un 404 genérico también cuando la entrada es de otro colaborador: no se revela que existe.
    const entry = collaborator.skills.find((skill) => skill.id === id);
    if (!entry) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    if (!(await this.skillRepository.findById(data.skillId))) {
      throw new NotFoundException({ message: 'Habilidad no encontrada' });
    }

    const takenByAnotherEntry = collaborator.skills.some(
      (other) => other.id !== id && other.skill.id === data.skillId,
    );
    if (takenByAnotherEntry) {
      throw new ConflictException({ message: DUPLICATED_SKILL });
    }

    const updated = await this.collaboratorSkillRepository.update(id, {
      skillId: data.skillId,
      level: data.level,
      experienceMonths: data.experienceMonths,
      lastUsedYear: data.lastUsedYear ?? null,
    });

    if (!updated) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return toCollaboratorSkillResponse(updated);
  }
}
