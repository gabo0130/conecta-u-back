import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { toCollaboratorSkillResponse } from '../mappers/collaborator-response.mapper';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

@Injectable()
export class ListMyCollaboratorSkillsUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    return { skills: collaborator.skills.map(toCollaboratorSkillResponse) };
  }
}
