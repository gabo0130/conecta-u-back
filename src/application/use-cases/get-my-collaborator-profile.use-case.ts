import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { COLLABORATOR_REPOSITORY } from '../../shared/interfaces/tokens';
import { toCollaboratorProfileResponse } from '../mappers/collaborator-response.mapper';
import { findMyCollaboratorOrFail } from '../support/my-collaborator';

@Injectable()
export class GetMyCollaboratorProfileUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
  ) {}

  async execute(userId: string) {
    const collaborator = await findMyCollaboratorOrFail(
      this.collaboratorRepository,
      userId,
    );
    return toCollaboratorProfileResponse(collaborator);
  }
}
