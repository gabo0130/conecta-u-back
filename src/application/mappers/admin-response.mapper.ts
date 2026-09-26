import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { UserEntity } from '../../domain/entities/user.entity';
import { toCollaboratorProfileResponse } from './collaborator-response.mapper';

// Respuestas de las rutas /admin/*: agregan al proyecto o al perfil los datos que solo ve el ADMIN
// (líder, cuenta vinculada, proyectos que lidera).

/** Cuenta vinculada a un perfil técnico (null si la persona no tiene usuario). */
export function toLinkedUser(user: UserEntity | undefined) {
  return user
    ? {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        active: user.active,
      }
    : null;
}

/** Líder del proyecto y, si lo tiene, el id de su perfil técnico. */
export function toLeaderSummary(
  user: UserEntity | undefined,
  collaboratorIdByUserId: Map<string, string>,
) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    active: user.active,
    collaboratorId: collaboratorIdByUserId.get(user.id) ?? null,
  };
}

export function toAdminProjectResponse(
  project: ProjectEntity,
  usersById: Map<string, UserEntity>,
  collaboratorIdByUserId: Map<string, string>,
) {
  return {
    ...project,
    leader: toLeaderSummary(
      usersById.get(project.leaderId),
      collaboratorIdByUserId,
    ),
  };
}

export function toAdminCollaboratorSummary(
  collaborator: CollaboratorEntity,
  usersById: Map<string, UserEntity>,
) {
  return {
    id: collaborator.id,
    email: collaborator.email,
    firstName: collaborator.firstName,
    lastName: collaborator.lastName,
    personType: collaborator.personType,
    programId: collaborator.programId,
    availabilityStatus: collaborator.availabilityStatus,
    weeklyHours: collaborator.weeklyHours,
    source: collaborator.source,
    active: collaborator.active,
    dataConsent: collaborator.dataConsent,
    skillsCount: collaborator.skills.length,
    experiencesCount: collaborator.experiences.length,
    user: toLinkedUser(
      collaborator.userId ? usersById.get(collaborator.userId) : undefined,
    ),
  };
}

export function toAdminCollaboratorDetail(
  collaborator: CollaboratorEntity,
  user: UserEntity | undefined,
  ledProjects: ProjectEntity[],
) {
  return {
    ...toCollaboratorProfileResponse(collaborator),
    active: collaborator.active,
    dataConsentAt: collaborator.dataConsentAt,
    user: toLinkedUser(user),
    ledProjects: ledProjects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
    })),
  };
}

/** Índices usados por los listados del ADMIN para unir proyectos, usuarios y perfiles en memoria. */
export function indexUsers(users: UserEntity[]) {
  return new Map(users.map((user) => [user.id, user]));
}

export function indexCollaboratorsByUser(collaborators: CollaboratorEntity[]) {
  return new Map(
    collaborators
      .filter((collaborator) => collaborator.userId)
      .map((collaborator) => [collaborator.userId as string, collaborator.id]),
  );
}
