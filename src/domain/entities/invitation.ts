/**
 * Convocatoria por correo (RF21–RF22, HU-18). El líder invita a personas recomendadas para su
 * proyecto; cada envío queda en el historial con su estado. El correo se envía por el servidor
 * SMTP configurado (host local en el PMV).
 */
export const INVITATION_STATUSES = ['ENVIADA', 'FALLIDA'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_LIMITS = {
  maxRecipients: 20,
  messageMin: 20,
  messageMax: 2000,
  /** No se vuelve a convocar a la misma persona para el mismo proyecto antes de este plazo. */
  resendCooldownHours: 24,
} as const;

export interface InvitationEntity {
  id: string;
  projectId: string;
  collaboratorId: string | null;
  requiredProfileId: string | null;
  sentById: string;
  /** Nombre de la persona al momento del envío (sigue en el historial aunque cambie). */
  recipientName: string;
  recipientEmail: string;
  profileName: string | null;
  status: InvitationStatus;
  errorMessage: string | null;
  sentAt: Date;
}

/** El correo se muestra al líder solo enmascarado: confirma a quién llegó sin exponerlo. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
