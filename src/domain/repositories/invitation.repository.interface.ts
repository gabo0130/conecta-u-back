import type {
  InvitationEntity,
  InvitationStatus,
} from '../entities/invitation';

export type NewInvitation = Omit<InvitationEntity, 'id' | 'sentAt'>;

export interface InvitationRepository {
  createMany(rows: NewInvitation[]): Promise<InvitationEntity[]>;
  /** Historial del proyecto, del más reciente al más antiguo. */
  findByProject(projectId: string): Promise<InvitationEntity[]>;
  /** Personas convocadas con éxito para el proyecto desde `since` (para no repetir). */
  findRecentRecipientIds(projectId: string, since: Date): Promise<string[]>;
  countByStatus(): Promise<Record<InvitationStatus, number>>;
}
