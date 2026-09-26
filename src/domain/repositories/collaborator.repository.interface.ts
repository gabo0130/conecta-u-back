import type { AvailabilityStatus } from '../entities/availability-status.type';
import { CollaboratorEntity } from '../entities/collaborator.entity';
import type { CollaboratorSource } from '../entities/collaborator-source.type';
import type { PersonType } from '../entities/person-type.type';

export interface CreateCollaboratorRepositoryDto {
  email: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  personType: PersonType;
  programId: string;
  semester?: number | null;
  researchGroup?: string | null;
  summary?: string | null;
  profileUrl?: string | null;
  availabilityStatus?: AvailabilityStatus;
  weeklyHours?: number;
  dataConsent?: boolean;
  dataConsentAt?: Date | null;
  source?: CollaboratorSource;
}

export interface UpdateCollaboratorRepositoryDto {
  userId?: string | null;
  firstName?: string;
  lastName?: string;
  programId?: string;
  semester?: number | null;
  researchGroup?: string | null;
  summary?: string | null;
  profileUrl?: string | null;
  availabilityStatus?: AvailabilityStatus;
  weeklyHours?: number;
  dataConsent?: boolean;
  dataConsentAt?: Date | null;
  active?: boolean;
}

export interface CollaboratorRepository {
  findById(id: string): Promise<CollaboratorEntity | null>;
  findByUserId(userId: string): Promise<CollaboratorEntity | null>;
  findByEmail(email: string): Promise<CollaboratorEntity | null>;
  /** Todas las personas con perfil técnico, con o sin usuario (vista del ADMIN). */
  findAll(): Promise<CollaboratorEntity[]>;
  create(data: CreateCollaboratorRepositoryDto): Promise<CollaboratorEntity>;
  update(
    id: string,
    data: UpdateCollaboratorRepositoryDto,
  ): Promise<CollaboratorEntity | null>;
}
