import { Type } from '@google/genai';
import type { Schema } from '@google/genai';
import {
  PROFILES_PER_ANALYSIS,
  SKILLS_PER_PROFILE,
} from '../../domain/entities/analysis-limits';
import { LEVELS } from '../../domain/entities/level.type';
import { PRIORITIES } from '../../domain/entities/priority.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';
import type { AnalysisInput } from '../../domain/repositories/project-analyzer.interface';

/**
 * Cambiar el texto de abajo exige subir esta versión: queda registrada en cada análisis (RNF8).
 * v2 (ajustes v2.2, E6): describe los tres tipos con la clasificación nueva.
 * v3 (19/11/2026): catálogo agrupado por tipo y sin categoría (~60 % menos tokens de catálogo),
 * escala de niveles, criterio de importancia y de horas, qué hacer con poca información, y la
 * duración del proyecto. Sin límites de largo para el resumen y la descripción ni «propón menos
 * perfiles»: en la comparación del 19/11 esas dos reglas hacían que Claude propusiera la mitad
 * de los perfiles (un solo perfil en proyectos que necesitaban varios).
 */
export const ANALYSIS_PROMPT_VERSION = 'v3';

/** Qué significa cada tipo (v2.2, E6). Los valores del enum no cambian, solo su descripción. */
export const SKILL_TYPE_DESCRIPTIONS: Record<SkillType, string> = {
  CONOCIMIENTO:
    'conocimiento técnico: herramientas y tecnologías (p. ej. Python, AutoCAD, SPSS)',
  COMPETENCIA:
    'competencia técnica: el rol o la disciplina que se ejerce (p. ej. investigador, desarrollador, analista)',
  HABILIDAD_BLANDA:
    'competencia blanda: cómo trabaja la persona con otros (p. ej. comunicación, liderazgo)',
};

/** Qué significa cada nivel mínimo: alimenta el puntaje de habilidades del matchmaking. */
const LEVEL_DESCRIPTIONS = [
  'BASICO: fundamentos, trabaja con acompañamiento',
  'INTERMEDIO: autónomo en tareas habituales',
  'AVANZADO: resuelve problemas complejos sin ayuda',
  'EXPERTO: define buenas prácticas, lidera o enseña',
].join('; ');

export const ANALYSIS_SYSTEM_INSTRUCTION = [
  'Eres un asistente que ayuda a líderes de proyectos universitarios a definir qué perfiles de colaboradores necesitan.',
  'Analiza el proyecto y propón los perfiles requeridos para ejecutarlo.',
  'Reglas:',
  `- Propón entre ${PROFILES_PER_ANALYSIS.min} y ${PROFILES_PER_ANALYSIS.max} perfiles.`,
  '- Si al proyecto le falta información, dilo en el resumen y no inventes necesidades.',
  `- Cada perfil lleva entre ${SKILLS_PER_PROFILE.min} y ${SKILLS_PER_PROFILE.max} habilidades e incluye al menos una competencia blanda (HABILIDAD_BLANDA).`,
  '- Clasifica cada habilidad en uno de estos tipos:',
  ...SKILL_TYPES.map(
    (type) => `  - ${type}: ${SKILL_TYPE_DESCRIPTIONS[type]}.`,
  ),
  '- Usa exactamente el nombre del catálogo cuando exista una habilidad equivalente; solo si no existe, nómbrala de forma breve.',
  '- Incluye las competencias que el líder ya identificó en el perfil que corresponda.',
  `- nivelMinimo: ${LEVEL_DESCRIPTIONS}. El nivel es el mínimo que el proyecto necesita, no el ideal.`,
  '- importancia: ALTA si sin ella no se cumple un objetivo o entregable; MEDIA si lo facilita; BAJA si es deseable.',
  '- horasSemanaSugeridas: según la carga del perfil y la duración del proyecto.',
  '- La justificación va en español, de 1 a 3 frases, y cita los objetivos o entregables del proyecto que la motivan.',
  '- No inventes datos de personas ni nombres propios: describe únicamente perfiles.',
].join('\n');

/**
 * Esquema de salida (claves en español, ver §4 del contrato). Sin `minItems`/`maxItems`: con
 * ellos Gemini rechaza el esquema (400 «too many states», probado el 19/11/2026). Los rangos los
 * pide el prompt y los aplica `parseAnalysisOutput`, que recorta el exceso.
 */
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
  if (project.durationMonths) {
    lines.push(`Duración: ${project.durationMonths} meses`);
  }

  lines.push('', '## Entregables');
  if (project.deliverables.length === 0) lines.push('(sin entregables)');
  for (const deliverable of project.deliverables) {
    lines.push(`- ${deliverable.name}: ${deliverable.scope}`);
  }

  if (project.knownSkills.length > 0) {
    lines.push(
      '',
      '## Competencias técnicas y blandas requeridas por el proyecto (según el líder)',
    );
    for (const skill of project.knownSkills) {
      lines.push(`- ${skill.name} (${skill.type})`);
    }
  }

  // Una línea por tipo: repetir el tipo y la categoría en cada habilidad costaba ~60 % más.
  lines.push('', '## Catálogo de habilidades (usa estos nombres exactos)');
  for (const type of SKILL_TYPES) {
    const names = catalog
      .filter((item) => item.type === type)
      .map((item) => item.name);
    if (names.length > 0) lines.push(`${type}: ${names.join(', ')}`);
  }
  return lines.join('\n');
}
