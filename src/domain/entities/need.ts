import type { TextLength } from './text-rules';

/**
 * Necesidad institucional en lenguaje natural (tesis PGCS01, D1). Un formulador (rol LIDER) la
 * registra, la IA la caracteriza y, si procede, se convierte en una oportunidad: un proyecto que
 * sigue el flujo normal de análisis y recomendación. Extensión de la tesis: no cambia las HU del
 * seminario.
 */
export const NEED_KINDS = [
  'ACADEMICA',
  'ADMINISTRATIVA',
  'INVESTIGATIVA',
  'TECNOLOGICA',
  'BIENESTAR',
  'INFRAESTRUCTURA',
  'INNOVACION',
] as const;
export type NeedKind = (typeof NEED_KINDS)[number];

/** REGISTRADA → CARACTERIZADA → CONVERTIDA; DESCARTADA desde cualquiera de las dos primeras. */
export const NEED_STATUSES = [
  'REGISTRADA',
  'CARACTERIZADA',
  'CONVERTIDA',
  'DESCARTADA',
] as const;
export type NeedStatus = (typeof NEED_STATUSES)[number];

/** Estados en los que la necesidad todavía se puede editar, caracterizar o convertir. */
export const OPEN_NEED_STATUSES: readonly NeedStatus[] = [
  'REGISTRADA',
  'CARACTERIZADA',
];

export const isOpenNeed = (status: NeedStatus): boolean =>
  OPEN_NEED_STATUSES.includes(status);

export const NEED_LIMITS = {
  title: { min: 5, max: 160 } satisfies TextLength,
  description: { min: 30, max: 4000 } satisfies TextLength,
  dependencyMax: 150,
  discardReasonMax: 500,
  /** Escala de urgencia e impacto que declara el formulador. */
  scale: { min: 1, max: 5 },
} as const;

/** Competencia del catálogo que la caracterización asocia a la necesidad. */
export interface NeedCompetency {
  skillId: string;
  name: string;
}

/** Resultado de la caracterización con IA (T2), ya validado y emparejado con el catálogo. */
export interface NeedCharacterization {
  problem: string;
  objective: string;
  beneficiaries: string;
  expectedResults: string[];
  competencies: NeedCompetency[];
  /** Nombres que propuso la IA y no están en el catálogo (se muestran, no se emparejan). */
  unmatchedCompetencies: string[];
  /** Código del tipo de proyecto sugerido (catálogo `project_types`), o null. */
  suggestedProjectTypeCode: string | null;
  missingInformation: string[];
  provider: string;
  model: string;
  promptVersion: string;
}

export interface NeedEntity {
  id: string;
  title: string;
  description: string;
  kind: NeedKind;
  status: NeedStatus;
  urgency: number;
  impact: number;
  /** Fecha esperada de atención (AAAA-MM-DD), opcional. */
  deadline: string | null;
  /** Unidad o dependencia que plantea la necesidad, opcional. */
  dependency: string | null;
  characterization: NeedCharacterization | null;
  characterizedAt: Date | null;
  /** Índice de completitud 0–100 (T3). */
  completeness: number;
  /** Puntaje de prioridad 0–100 (T4). */
  priorityScore: number;
  /** Proyecto (oportunidad) en que se convirtió (T5). */
  projectId: string | null;
  discardReason: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
