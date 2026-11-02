import { Inject, Injectable } from '@nestjs/common';
import type { InvitationRepository } from '../../domain/repositories/invitation.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import {
  INVITATION_REPOSITORY,
  PROJECT_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { toInvitationResponse } from '../mappers/invitation-response.mapper';
import { type Actor, loadProjectForViewer } from '../support/project-access';

/** RF22: historial de convocatorias del proyecto (líder dueño o ADMIN). */
@Injectable()
export class ListInvitationsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepository: InvitationRepository,
  ) {}

  async execute(actor: Actor, projectId: string) {
    await loadProjectForViewer(this.projectRepository, actor, projectId);
    const invitations =
      await this.invitationRepository.findByProject(projectId);
    const revealEmail = actor.role === 'ADMIN';
    return {
      projectId,
      invitations: invitations.map((item) =>
        toInvitationResponse(item, revealEmail),
      ),
    };
  }
}
