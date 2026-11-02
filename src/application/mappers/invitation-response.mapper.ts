import {
  type InvitationEntity,
  maskEmail,
} from '../../domain/entities/invitation';

/**
 * Historial de convocatorias (RF22): fecha, destinatario y estado. El líder ve el correo
 * enmascarado (Ley 1581: confirma el envío sin exponer el dato); el ADMIN, completo.
 */
export function toInvitationResponse(
  invitation: InvitationEntity,
  revealEmail: boolean,
) {
  return {
    id: invitation.id,
    collaboratorId: invitation.collaboratorId,
    requiredProfileId: invitation.requiredProfileId,
    profileName: invitation.profileName,
    recipientName: invitation.recipientName,
    recipientEmail: revealEmail
      ? invitation.recipientEmail
      : maskEmail(invitation.recipientEmail),
    status: invitation.status,
    errorMessage: invitation.errorMessage,
    sentAt: invitation.sentAt,
  };
}
