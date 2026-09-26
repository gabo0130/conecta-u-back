import { isCalendarDate } from './calendar-date';
import type { TemplateField } from './template-field.type';

export class ProjectTypeEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly templateFields: TemplateField[] = [],
    public readonly active: boolean = true,
  ) {}

  /**
   * Valida `typeData` contra la plantilla del tipo (RF7–RF8): sin claves desconocidas,
   * con todos los campos obligatorios y cada valor acorde a su `kind`.
   * Devuelve los errores encontrados; vacío si es válido.
   */
  validateTypeData(typeData: Record<string, unknown>): string[] {
    const fieldsByKey = new Map(
      this.templateFields.map((field) => [field.key, field]),
    );
    const errors = Object.keys(typeData)
      .filter((key) => !fieldsByKey.has(key))
      .map((key) => `Campo desconocido: ${key}`);

    for (const field of this.templateFields) {
      const value = typeData[field.key];
      if (isEmpty(value)) {
        if (field.required) {
          errors.push(`Falta el campo obligatorio: ${field.label}`);
        }
        continue;
      }
      if (!matchesKind(field, value)) {
        errors.push(`Valor inválido para el campo: ${field.label}`);
      }
    }

    return errors;
  }
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function matchesKind(field: TemplateField, value: unknown): boolean {
  switch (field.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'date':
      return typeof value === 'string' && isCalendarDate(value);
    case 'select':
      return typeof value === 'string' && (field.options ?? []).includes(value);
    case 'text':
    case 'textarea':
      return typeof value === 'string';
  }
}
