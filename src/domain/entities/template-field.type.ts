export const TEMPLATE_FIELD_KINDS = [
  'text',
  'textarea',
  'number',
  'date',
  'select',
  // v2.1 (A6): lista de palabras clave y valor en pesos colombianos.
  'tags',
  'currency',
] as const;

export type TemplateFieldKind = (typeof TEMPLATE_FIELD_KINDS)[number];

export interface TemplateField {
  key: string;
  label: string;
  kind: TemplateFieldKind;
  required: boolean;
  /** Solo para `select`. */
  options?: string[];
  /** Solo para `tags`: cuántas palabras clave se piden (p. ej. entre 3 y 5). */
  minItems?: number;
  maxItems?: number;
}

/** Límites de una lista de palabras clave (`tags`). */
export const TAGS_LIMITS = { min: 1, max: 20 } as const;
export const TAG_MAX_LENGTH = 40;
