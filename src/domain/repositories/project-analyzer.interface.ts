import type { Level } from '../entities/level.type';
import type { Priority } from '../entities/priority.type';
import type { SkillCategory } from '../entities/skill-category.type';
import type { SkillType } from '../entities/skill-type.type';

/** Lo que se le entrega a la IA: el proyecto y el catálogo, nunca datos de personas. */
export interface AnalysisInput {
  project: {
    title: string;
    summary: string;
    objectives: string;
    type: { name: string; fields: { label: string; value: string }[] };
    category: string;
    program: string | null;
    deliverables: { name: string; scope: string }[];
    knownSkills: { name: string; type: SkillType }[];
  };
  /** Habilidades ACTIVAS del catálogo, para que la IA elija nombres de esta lista. */
  catalog: { name: string; type: SkillType; category: SkillCategory }[];
}

/** Respuesta del modelo tal como llegó (JSON ya parseado, pero sin validar). */
export interface AnalyzerResponse {
  output: unknown;
  usage: { inputTokens: number | null; outputTokens: number | null };
  /** Modelo que realmente respondió, si difiere del configurado (respaldo ante alta demanda). */
  model?: string;
}

/** Perfil ya validado, listo para mapearse al catálogo. */
export interface AnalyzedProfile {
  name: string;
  description: string;
  justification: string;
  quantity: number;
  priority: Priority;
  suggestedWeeklyHours: number | null;
  skills: {
    name: string;
    type: SkillType;
    minLevel: Level;
    importance: Priority;
  }[];
}

export interface AnalysisOutput {
  summary: string;
  profiles: AnalyzedProfile[];
}

export interface AnalyzeOptions {
  /** Tiempo que le queda al análisis completo: incluye los reintentos internos del proveedor. */
  timeoutMs: number;
}

export interface ProjectAnalyzer {
  readonly provider: string;
  readonly model: string;
  /** Versión del prompt, para poder explicar un resultado pasado (RNF8). */
  readonly promptVersion: string;
  /**
   * Falso si el proveedor ya sabe que no puede responder (p. ej. cuota diaria agotada): el
   * análisis se rechaza sin crear el intento ni gastar el límite diario del proyecto.
   */
  isAvailable(): boolean;
  /**
   * @throws AnalyzerUnavailableError si el servicio no responde, agota la cuota o tarda demasiado.
   */
  analyze(
    input: AnalysisInput,
    options: AnalyzeOptions,
  ): Promise<AnalyzerResponse>;
}

/** El proveedor de IA no está disponible (caída, timeout, cuota): se responde 503 (RF12). */
export class AnalyzerUnavailableError extends Error {}

/** La salida del modelo no cumple el esquema esperado. */
export class InvalidAnalysisOutputError extends Error {}
