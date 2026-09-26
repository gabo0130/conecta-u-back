import { NotFoundException } from '@nestjs/common';
import type { ProgramEntity } from '../../domain/entities/program.entity';
import type { ProjectCategoryEntity } from '../../domain/entities/project-category.entity';
import type { ProjectTypeEntity } from '../../domain/entities/project-type.entity';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';

// Los ids de catálogo llegan del cliente: se verifican antes de escribir para responder
// un 404 claro en lugar de un error de llave foránea (500) o de ignorarlos en silencio.

export async function findProgramOrFail(
  programRepository: ProgramRepository,
  programId: string,
): Promise<ProgramEntity> {
  const program = await programRepository.findById(programId);
  if (!program || !program.active) {
    throw new NotFoundException({ message: 'Programa no encontrado' });
  }
  return program;
}

export async function findProjectTypeOrFail(
  projectTypeRepository: ProjectTypeRepository,
  typeId: string,
): Promise<ProjectTypeEntity> {
  const type = await projectTypeRepository.findById(typeId);
  if (!type || !type.active) {
    throw new NotFoundException({ message: 'Tipo de proyecto no encontrado' });
  }
  return type;
}

export async function findProjectCategoryOrFail(
  projectCategoryRepository: ProjectCategoryRepository,
  categoryId: string,
): Promise<ProjectCategoryEntity> {
  const category = await projectCategoryRepository.findById(categoryId);
  if (!category || !category.active) {
    throw new NotFoundException({
      message: 'Categoría de proyecto no encontrada',
    });
  }
  return category;
}

export async function assertSkillsExist(
  skillRepository: SkillRepository,
  skillIds: string[] | undefined,
): Promise<void> {
  const uniqueIds = [...new Set(skillIds ?? [])];
  if (uniqueIds.length === 0) {
    return;
  }
  const found = await skillRepository.findByIds(uniqueIds);
  if (found.length !== uniqueIds.length) {
    throw new NotFoundException({ message: 'Habilidad no encontrada' });
  }
}
