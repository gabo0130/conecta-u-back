import { Type } from '@google/genai';
import type { Schema } from '@google/genai';
import { NEED_CHARACTERIZATION_LIMITS } from '../../domain/entities/need';
import type { CharacterizationInput } from '../../domain/repositories/need-characterizer.interface';

/** Cambiar el texto de abajo exige subir esta versión: queda guardada en cada caracterización. */
export const CHARACTERIZATION_PROMPT_VERSION = 'v1';

const { listMax, competenciesMax } = NEED_CHARACTERIZATION_LIMITS;

export const CHARACTERIZATION_SYSTEM_INSTRUCTION = [
  'Eres un asistente que ayuda a la Universidad Francisco de Paula Santander (UFPS) a caracterizar necesidades institucionales escritas en lenguaje natural.',
  'Extrae del texto: el problema, el objetivo que resolvería la necesidad, los beneficiarios y los resultados esperados; propone las competencias necesarias para atenderla y el tipo de proyecto más adecuado.',
  'Reglas:',
  '- Usa solo lo que dice el texto o se deduce directamente de él; si un elemento no aparece, déjalo vacío ("" o []) y nómbralo en "informacionFaltante".',
  `- "competencias": entre 1 y ${competenciesMax} nombres tomados exactamente del catálogo de habilidades.`,
  `- "resultadosEsperados" e "informacionFaltante": como máximo ${listMax} elementos cada uno, frases cortas.`,
  '- "tipoProyectoSugerido": uno de los códigos de la lista de tipos de proyecto.',
  '- Si falta el plazo esperado o la dependencia que plantea la necesidad, inclúyelo en "informacionFaltante".',
  '- Escribe en español. No inventes datos de personas ni nombres propios.',
  '- Responde solo con el JSON del esquema indicado.',
].join('\n');

export const CHARACTERIZATION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    problema: { type: Type.STRING },
    objetivo: { type: Type.STRING },
    beneficiarios: { type: Type.STRING },
    resultadosEsperados: { type: Type.ARRAY, items: { type: Type.STRING } },
    competencias: { type: Type.ARRAY, items: { type: Type.STRING } },
    tipoProyectoSugerido: { type: Type.STRING },
    informacionFaltante: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'problema',
    'objetivo',
    'beneficiarios',
    'resultadosEsperados',
    'competencias',
    'informacionFaltante',
  ],
};

export function buildCharacterizationPrompt({
  need,
  catalog,
  projectTypes,
}: CharacterizationInput): string {
  return [
    '## Necesidad',
    `Título: ${need.title}`,
    `Tipo de necesidad: ${need.kind}`,
    `Dependencia que la plantea: ${need.dependency ?? '(no indicada)'}`,
    `Plazo esperado: ${need.hasDeadline ? 'indicado por el formulador' : '(no indicado)'}`,
    'Descripción:',
    need.description,
    '',
    '## Tipos de proyecto (código | nombre)',
    ...projectTypes.map((type) => `${type.code} | ${type.name}`),
    '',
    '## Catálogo de habilidades (nombre | tipo)',
    ...catalog.map((item) => `${item.name} | ${item.type}`),
  ].join('\n');
}
