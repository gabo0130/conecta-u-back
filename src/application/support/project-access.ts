import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { UserRole } from '../../domain/entities/user-role.type';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';

export interface Actor {
  userId: string;
  role: UserRole;
}

/**
 * Carga un proyecto para consultarlo: lo ve su líder y el ADMIN (RNF4). Cualquier otro
 * recibe 403, igual que en `GET /projects/:id`.
 */
export async function loadProjectForViewer(
  projectRepository: ProjectRepository,
  actor: Actor,
  projectId: string,
): Promise<ProjectEntity> {
  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw new NotFoundException({ message: 'Recurso no encontrado' });
  }
  if (actor.role !== 'ADMIN' && project.leaderId !== actor.userId) {
    throw new ForbiddenException({ message: 'Prohibido' });
  }
  return project;
}

/**
 * Carga un proyecto para analizarlo con IA o generar sus recomendaciones (RF6, RF8): su líder
 * dueño o el ADMIN, que también registra proyectos a nombre de un líder (v2.1, A5). Editar el
 * proyecto o sus perfiles requeridos sigue siendo solo del líder (`loadOwnedProject`).
 */
export async function loadProjectForAnalysis(
  projectRepository: ProjectRepository,
  actor: Actor,
  projectId: string,
): Promise<ProjectEntity> {
  return loadProjectForViewer(projectRepository, actor, projectId);
}

/** Carga un proyecto para modificarlo: solo su líder dueño (RNF4). */
export async function loadOwnedProject(
  projectRepository: ProjectRepository,
  userId: string,
  projectId: string,
): Promise<ProjectEntity> {
  const project = await projectRepository.findById(projectId);
  if (!project) {
    throw new NotFoundException({ message: 'Recurso no encontrado' });
  }
  if (project.leaderId !== userId) {
    throw new ForbiddenException({ message: 'Prohibido' });
  }
  return project;
}
