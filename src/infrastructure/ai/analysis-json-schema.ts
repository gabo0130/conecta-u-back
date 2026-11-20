import {
  PROFILES_PER_ANALYSIS,
  SKILLS_PER_PROFILE,
} from '../../domain/entities/analysis-limits';
import { LEVELS } from '../../domain/entities/level.type';
import { PRIORITIES } from '../../domain/entities/priority.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';

/**
 * El mismo esquema de salida de `ANALYSIS_RESPONSE_SCHEMA` (Gemini) en JSON Schema estándar,
 * para las salidas estructuradas de Claude. Toda clase de objeto lleva `additionalProperties:
 * false`; los rangos (cantidad de perfiles y habilidades) no los admite el esquema: los valida
 * `parseAnalysisOutput` igual que con Gemini y van como texto en la descripción.
 */
export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'perfiles'],
  properties: {
    resumen: { type: 'string' },
    perfiles: {
      type: 'array',
      description: `Entre ${PROFILES_PER_ANALYSIS.min} y ${PROFILES_PER_ANALYSIS.max} perfiles.`,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'nombre',
          'descripcion',
          'justificacion',
          'cantidad',
          'prioridad',
          'horasSemanaSugeridas',
          'habilidades',
        ],
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          justificacion: { type: 'string' },
          cantidad: { type: 'integer' },
          prioridad: { type: 'string', enum: [...PRIORITIES] },
          horasSemanaSugeridas: {
            anyOf: [{ type: 'integer' }, { type: 'null' }],
          },
          habilidades: {
            type: 'array',
            description: `Entre ${SKILLS_PER_PROFILE.min} y ${SKILLS_PER_PROFILE.max} habilidades.`,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['nombre', 'tipo', 'nivelMinimo', 'importancia'],
              properties: {
                nombre: { type: 'string' },
                tipo: { type: 'string', enum: [...SKILL_TYPES] },
                nivelMinimo: { type: 'string', enum: [...LEVELS] },
                importancia: { type: 'string', enum: [...PRIORITIES] },
              },
            },
          },
        },
      },
    },
  },
} as const;
