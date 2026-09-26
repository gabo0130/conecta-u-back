import { BadRequestException } from '@nestjs/common';
import type { ProjectTypeEntity } from '../../domain/entities/project-type.entity';

/** RF7–RF8: los campos de la plantilla del tipo deben venir completos y bien formados. */
export function assertValidTypeData(
  type: ProjectTypeEntity,
  typeData: Record<string, unknown>,
): void {
  const [firstError] = type.validateTypeData(typeData);
  if (firstError) {
    throw new BadRequestException({ message: firstError });
  }
}
