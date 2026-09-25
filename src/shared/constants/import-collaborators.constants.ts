// Las celdas de un .xlsx llegan tipadas `unknown` (string | number | Date | null | objeto de
// texto enriquecido); este archivo las normaliza a string a propósito.
/* eslint-disable @typescript-eslint/no-base-to-string */
import type { AvailabilityStatus } from '../../domain/entities/availability-status.type';
import type { ExperienceType } from '../../domain/entities/experience-type.type';
import type { Level } from '../../domain/entities/level.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';

export const SHEET_COLLABORATORS = 'Colaboradores';
export const SHEET_SKILLS = 'Habilidades';
export const SHEET_EXPERIENCE = 'Experiencia';

export const REQUIRED_SHEETS = [
  SHEET_COLLABORATORS,
  SHEET_SKILLS,
  SHEET_EXPERIENCE,
];

export const COLLABORATOR_HEADERS = [
  'correo',
  'nombres',
  'apellidos',
  'tipo_persona',
  'programa',
  'semestre',
  'semillero_o_grupo',
  'resumen',
  'enlace',
  'disponibilidad',
  'horas_semana',
  'autoriza_datos',
] as const;

export const SKILL_HEADERS = [
  'correo',
  'habilidad',
  'tipo',
  'categoria',
  'nivel',
  'meses_experiencia',
  'ultimo_uso',
] as const;

export const EXPERIENCE_HEADERS = [
  'correo',
  'tipo',
  'rol',
  'organizacion',
  'fecha_inicio',
  'fecha_fin',
  'actual',
  'horas_semana',
  'nivel',
  'tecnologias',
  'descripcion',
] as const;

export function normalizeLabel(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export const PERSON_TYPE_LABELS: Record<string, PersonType> = {
  estudiante: 'ESTUDIANTE',
  docente: 'DOCENTE',
};

export const AVAILABILITY_LABELS: Record<string, AvailabilityStatus> = {
  disponible: 'DISPONIBLE',
  parcial: 'PARCIAL',
  'no disponible': 'NO_DISPONIBLE',
};

export const LEVEL_LABELS: Record<string, Level> = {
  basico: 'BASICO',
  intermedio: 'INTERMEDIO',
  avanzado: 'AVANZADO',
  experto: 'EXPERTO',
};

export const SKILL_TYPE_LABELS: Record<string, SkillType> = {
  conocimiento: 'CONOCIMIENTO',
  competencia: 'COMPETENCIA',
  'habilidad blanda': 'HABILIDAD_BLANDA',
};

export const EXPERIENCE_TYPE_LABELS: Record<string, ExperienceType> = {
  laboral: 'LABORAL',
  practica: 'PRACTICA',
  'proyecto academico': 'PROYECTO_ACADEMICO',
  'semillero de investigacion': 'SEMILLERO_INVESTIGACION',
  'proyecto personal': 'PROYECTO_PERSONAL',
  voluntariado: 'VOLUNTARIADO',
  docencia: 'DOCENCIA',
};

export const YES_LABELS = new Set(['si', 'sí', 'yes', 'true', '1']);

export const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
