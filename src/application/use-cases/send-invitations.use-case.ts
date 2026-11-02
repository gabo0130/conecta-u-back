import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  INVITATION_LIMITS,
  type InvitationStatus,
} from '../../domain/entities/invitation';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type {
  InvitationRepository,
  NewInvitation,
} from '../../domain/repositories/invitation.repository.interface';
import type { MailSender } from '../../domain/repositories/mail-sender.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RecommendationRepository } from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  APP_URL,
  COLLABORATOR_REPOSITORY,
  INVITATION_REPOSITORY,
  MAIL_SENDER,
  PROJECT_REPOSITORY,
  RECOMMENDATION_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { SendInvitationsDto } from '../dto/invitations.dto';
import { renderInvitationEmail } from '../mail/invitation-email.template';
import { toInvitationResponse } from '../mappers/invitation-response.mapper';
import { loadOwnedProject } from '../support/project-access';

export const NOT_RECOMMENDED =
  'Solo puedes convocar a personas recomendadas para este proyecto';
const DELIVERY_FAILED = 'El servidor de correo no aceptó el mensaje';

export type SkipReason = 'YA_CONVOCADA' | 'SIN_AUTORIZACION' | 'INACTIVA';

const SKIP_MESSAGE: Record<SkipReason, string> = {
  YA_CONVOCADA: `Ya fue convocada en las últimas ${INVITATION_LIMITS.resendCooldownHours} horas`,
  SIN_AUTORIZACION: 'Retiró la autorización de tratamiento de datos',
  INACTIVA: 'La persona fue dada de baja',
};

/**
 * RF21 (HU-18): el líder dueño convoca por correo a personas recomendadas para su proyecto.
 * Un correo por persona (si uno falla, los demás salen); cada envío queda en el historial
 * (RF22) como ENVIADA o FALLIDA. No se repite a la misma persona en 24 h.
 */
@Injectable()
export class SendInvitationsUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly recommendationRepository: RecommendationRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(INVITATION_REPOSITORY)
    private readonly invitationRepository: InvitationRepository,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
    @Inject(APP_URL) private readonly appUrl: string,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(SendInvitationsUseCase.name);
  }

  async execute(
    leaderUserId: string,
    projectId: string,
    dto: SendInvitationsDto,
    now = new Date(),
  ) {
    const project = await loadOwnedProject(
      this.projectRepository,
      leaderUserId,
      projectId,
    );

    const recommendations = await this.recommendationRepository.findByProject(
      projectId,
      { profileId: dto.requiredProfileId, includeUnavailable: true },
    );
    if (dto.requiredProfileId && recommendations.length === 0) {
      throw new NotFoundException({ message: 'Perfil no encontrado' });
    }
    const profileNameOf = await this.profileNames(recommendations);
    const recommendedProfile = new Map(
      recommendations.map((item) => [
        item.collaborator.id,
        item.requiredProfileId,
      ]),
    );
    if (dto.collaboratorIds.some((id) => !recommendedProfile.has(id))) {
      throw new UnprocessableEntityException({ message: NOT_RECOMMENDED });
    }

    const since = new Date(
      now.getTime() - INVITATION_LIMITS.resendCooldownHours * 3_600_000,
    );
    const recent = new Set(
      await this.invitationRepository.findRecentRecipientIds(projectId, since),
    );
    const leader = await this.userRepository.findById(project.leaderId);
    const leaderName = leader?.fullName ?? 'El líder del proyecto';

    const skipped: {
      collaboratorId: string;
      name: string;
      reason: SkipReason;
      message: string;
    }[] = [];
    const rows: NewInvitation[] = [];

    for (const collaboratorId of dto.collaboratorIds) {
      const person = await this.collaboratorRepository.findById(collaboratorId);
      const name = person ? `${person.firstName} ${person.lastName}` : '';
      const reason: SkipReason | null =
        !person || !person.active
          ? 'INACTIVA'
          : !person.dataConsent
            ? 'SIN_AUTORIZACION'
            : recent.has(collaboratorId)
              ? 'YA_CONVOCADA'
              : null;
      if (reason || !person) {
        skipped.push({
          collaboratorId,
          name,
          reason: reason ?? 'INACTIVA',
          message: SKIP_MESSAGE[reason ?? 'INACTIVA'],
        });
        continue;
      }

      const requiredProfileId =
        dto.requiredProfileId ?? recommendedProfile.get(collaboratorId) ?? null;
      const profileName = requiredProfileId
        ? (profileNameOf.get(requiredProfileId) ?? null)
        : null;
      const email = renderInvitationEmail({
        recipientFirstName: person.firstName,
        leaderName,
        projectTitle: project.title,
        projectSummary: project.summary,
        profileName,
        message: dto.message,
        hasAccount: person.userId !== null,
        appUrl: this.appUrl,
      });

      let status: InvitationStatus = 'ENVIADA';
      let errorMessage: string | null = null;
      try {
        await this.mailSender.send({
          to: person.email,
          ...email,
          ...(leader ? { replyTo: leader.email } : {}),
        });
      } catch (error) {
        status = 'FALLIDA';
        errorMessage = DELIVERY_FAILED;
        // Nunca la dirección en el log (Ley 1581): solo a qué proyecto y persona.
        this.logger.error('No se pudo enviar la convocatoria', error, {
          method: 'execute',
          projectId,
          collaboratorId,
        });
      }

      rows.push({
        projectId,
        collaboratorId,
        requiredProfileId,
        sentById: leaderUserId,
        recipientName: name,
        recipientEmail: person.email,
        profileName,
        status,
        errorMessage,
      });
    }

    const saved = await this.invitationRepository.createMany(rows);
    return {
      sent: saved.filter((row) => row.status === 'ENVIADA').length,
      failed: saved.filter((row) => row.status === 'FALLIDA').length,
      skipped,
      invitations: saved.map((row) => toInvitationResponse(row, false)),
    };
  }

  /** Nombre de cada perfil recomendado, para el correo y el historial. */
  private async profileNames(
    recommendations: { requiredProfileId: string }[],
  ): Promise<Map<string, string>> {
    const ids = [
      ...new Set(recommendations.map((item) => item.requiredProfileId)),
    ];
    const profiles = await Promise.all(
      ids.map((id) => this.requiredProfileRepository.findById(id)),
    );
    return new Map(
      profiles
        .filter((profile) => profile !== null)
        .map((profile) => [profile.id, profile.name]),
    );
  }
}
