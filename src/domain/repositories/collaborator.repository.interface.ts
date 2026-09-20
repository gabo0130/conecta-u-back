import type { AvailabilityStatus } from '../entities/availability-status.type';
import { CollaboratorEntity } from '../entities/collaborator.entity';

export interface UpdateCollaboratorRepositoryDto {
  headline?: string | null;
  studyGroup?: string | null;
  availabilityStatus?: AvailabilityStatus;
  weeklyHours?: string | null;
  modality?: string | null;
}

export interface CollaboratorRepository {
  findByUserId(userId: string): Promise<CollaboratorEntity | null>;
  update(
    userId: string,
    data: UpdateCollaboratorRepositoryDto,
  ): Promise<CollaboratorEntity | null>;
}
