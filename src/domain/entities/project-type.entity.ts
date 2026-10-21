import { isCalendarDate } from './calendar-date';
import { TAG_MAX_LENGTH, type TemplateField } from './template-field.type';

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
      if (field.kind === 'tags') {
        const tagsError = tagsErrorOf(field, value);
        if (tagsError) errors.push(tagsError);
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
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Palabras clave: textos no vacíos, sin repetir y en la cantidad que pide la plantilla. */
function tagsErrorOf(field: TemplateField, value: unknown): string | null {
  if (
    !Array.isArray(value) ||
    !value.every((tag) => typeof tag === 'string' && tag.trim() !== '')
  ) {
    return `Valor inválido para el campo: ${field.label}`;
  }
  const tags = value as string[];
  if (tags.some((tag) => tag.trim().length > TAG_MAX_LENGTH)) {
    return `Cada palabra clave de ${field.label} admite máximo ${TAG_MAX_LENGTH} caracteres`;
  }
  const unique = new Set(tags.map((tag) => tag.trim().toLowerCase()));
  if (unique.size !== tags.length) {
    return `Hay palabras clave repetidas en ${field.label}`;
  }
  const min = field.minItems ?? 1;
  const max = field.maxItems ?? Number.POSITIVE_INFINITY;
  if (tags.length < min || tags.length > max) {
    return Number.isFinite(max)
      ? `${field.label} necesita entre ${min} y ${max} palabras clave`
      : `${field.label} necesita al menos ${min} palabras clave`;
  }
  return null;
}

function matchesKind(field: TemplateField, value: unknown): boolean {
  switch (field.kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'date':
      return typeof value === 'string' && isCalendarDate(value);
    case 'select':
      return typeof value === 'string' && (field.options ?? []).includes(value);
    case 'currency':
      // Pesos colombianos: entero, sin centavos, no negativo.
      return (
        typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
      );
    case 'text':
    case 'textarea':
      return typeof value === 'string';
    case 'tags':
      return Array.isArray(value);
  }
}
