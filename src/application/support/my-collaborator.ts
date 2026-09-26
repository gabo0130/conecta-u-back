import { NotFoundException } from '@nestjs/common';
import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

export const COLLABORATOR_PROFILE_NOT_FOUND = 'Perfil de colaborador no encontrado';
export const DUPLICATED_SKILL = 'Ya tienes registrada esta habilidad';

/** Perfil técnico vinculado al usuario autenticado; 404 si todavía no tiene uno. */
export async function findMyCollaboratorOrFail(
  collaboratorRepository: CollaboratorRepository,
  userId: string,
): Promise<CollaboratorEntity> {
  const collaborator = await collaboratorRepository.findByUserId(userId);
  if (!collaborator) {
    throw new NotFoundException({ message: COLLABORATOR_PROFILE_NOT_FOUND });
  }
  return collaborator;
}
