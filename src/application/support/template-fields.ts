import type { TemplateField } from '../../domain/entities/template-field.type';

/**
 * Validación cruzada entre campos de una plantilla (RF7/RF22), que `class-validator` no cubre
 * por campo: claves repetidas y campos `select` sin opciones. Devuelve los errores en español;
 * vacío si es válida.
 */
export function validateTemplateFields(fields: TemplateField[]): string[] {
  const errors: string[] = [];
  const seenKeys = new Set<string>();

  for (const field of fields) {
    if (seenKeys.has(field.key)) {
      errors.push(`La clave "${field.key}" está repetida`);
    }
    seenKeys.add(field.key);

    if (field.kind === 'select' && (field.options ?? []).length === 0) {
      errors.push(
        `El campo "${field.label}" es de tipo lista y necesita al menos una opción`,
      );
    }
  }

  return errors;
}
