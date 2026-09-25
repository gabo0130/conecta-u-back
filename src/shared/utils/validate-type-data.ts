import { BadRequestException } from '@nestjs/common';
import type { TemplateField } from '../../domain/entities/template-field.type';

export function validateTypeData(
  templateFields: TemplateField[],
  typeData: Record<string, unknown>,
): void {
  const allowedKeys = new Set(templateFields.map((field) => field.key));

  for (const key of Object.keys(typeData)) {
    if (!allowedKeys.has(key)) {
      throw new BadRequestException({ message: `Campo desconocido: ${key}` });
    }
  }

  for (const field of templateFields) {
    if (!field.required) continue;
    const value = typeData[field.key];
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException({
        message: `Falta el campo obligatorio: ${field.label}`,
      });
    }
  }
}
