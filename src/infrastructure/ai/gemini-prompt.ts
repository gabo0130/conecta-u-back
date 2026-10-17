import { Type } from '@google/genai';
import type { Schema } from '@google/genai';
import {
  PROFILES_PER_ANALYSIS,
  SKILLS_PER_PROFILE,
} from '../../domain/entities/analysis-limits';
import { LEVELS } from '../../domain/entities/level.type';
import { PRIORITIES } from '../../domain/entities/priority.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { AnalysisInput } from '../../domain/repositories/project-analyzer.interface';

/** Cambiar el texto de abajo exige subir esta versión: queda registrada en cada análisis (RNF8). */
export const ANALYSIS_PROMPT_VERSION = 'v1';

export const ANALYSIS_SYSTEM_INSTRUCTION = [
  'Eres un asistente que ayuda a líderes de proyectos universitarios a definir qué perfiles de colaboradores necesitan.',
  'Analiza el proyecto y propone los perfiles requeridos para ejecutarlo.',
  'Reglas:',
  `- Propone entre ${PROFILES_PER_ANALYSIS.min} y ${PROFILES_PER_ANALYSIS.max} perfiles.`,
  `- Cada perfil lleva entre ${SKILLS_PER_PROFILE.min} y ${SKILLS_PER_PROFILE.max} habilidades e incluye al menos una habilidad blanda.`,
  '- Si en el catálogo existe una habilidad equivalente, usa exactamente su nombre del catálogo.',
  '- La justificación va en español, de 1 a 3 frases, y cita los objetivos o entregables del proyecto que la motivan.',
  '- No inventes datos de personas ni nombres propios: describe únicamente perfiles.',
  '- Responde solo con el JSON del esquema indicado.',
].join('\n');

/** Esquema de salida (claves en español, ver §4 del contrato). */
export const ANALYSIS_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    resumen: { type: Type.STRING },
    perfiles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING },
          descripcion: { type: Type.STRING },
          justificacion: { type: Type.STRING },
          cantidad: { type: Type.INTEGER },
          prioridad: { type: Type.STRING, enum: [...PRIORITIES] },
          horasSemanaSugeridas: { type: Type.INTEGER },
          habilidades: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nombre: { type: Type.STRING },
                tipo: { type: Type.STRING, enum: [...SKILL_TYPES] },
                nivelMinimo: { type: Type.STRING, enum: [...LEVELS] },
                importancia: { type: Type.STRING, enum: [...PRIORITIES] },
              },
              required: ['nombre', 'tipo', 'nivelMinimo', 'importancia'],
            },
          },
        },
        required: [
          'nombre',
          'descripcion',
          'justificacion',
          'cantidad',
          'prioridad',
          'habilidades',
        ],
      },
    },
  },
  required: ['resumen', 'perfiles'],
};

/** El prompt de usuario: el proyecto y el catálogo, nunca datos de personas. */
export function buildAnalysisPrompt({
  project,
  catalog,
}: AnalysisInput): string {
  const lines: string[] = [
    '## Proyecto',
    `Título: ${project.title}`,
    `Resumen: ${project.summary}`,
    `Objetivos: ${project.objectives}`,
    `Tipo: ${project.type.name}`,
    ...project.type.fields.map((field) => `- ${field.label}: ${field.value}`),
    `Categoría: ${project.category}`,
  ];
  if (project.program) lines.push(`Programa: ${project.program}`);

  lines.push('', '## Entregables');
  if (project.deliverables.length === 0) lines.push('(sin entregables)');
  for (const deliverable of project.deliverables) {
    lines.push(`- ${deliverable.name}: ${deliverable.scope}`);
  }

  if (project.knownSkills.length > 0) {
    lines.push('', '## Habilidades que el líder ya identificó');
    for (const skill of project.knownSkills) {
      lines.push(`- ${skill.name} (${skill.type})`);
    }
  }

  lines.push('', '## Catálogo de habilidades (nombre | tipo | categoría)');
  for (const item of catalog) {
    lines.push(`${item.name} | ${item.type} | ${item.category}`);
  }
  return lines.join('\n');
}
