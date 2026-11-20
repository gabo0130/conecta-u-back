import type { AnalysisAttempt } from '../entities/analysis-attempt.type';
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
    /** Duración estimada (v2.2, E5); orienta las horas y la cantidad de personas. */
    durationMonths: number | null;
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
  /** Proveedor que realmente respondió, si difiere del configurado (respaldo entre proveedores). */
  provider?: string;
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
  /**
   * Se llama una vez por cada llamada real al modelo, con su resultado y sus tokens. Así el
   * análisis registra lo que de verdad se facturó, también si al final falla.
   */
  onAttempt?: (attempt: AnalysisAttempt) => void;
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

/** El proveedor de IA no está disponible (caída, timeout, cuota): se responde 503 (RF8). */
export class AnalyzerUnavailableError extends Error {}

/** La salida del modelo no cumple el esquema esperado: el caso de uso la reintenta una vez. */
export class InvalidAnalysisOutputError extends Error {}

/**
 * La salida se cortó por el tope de tokens. No se reintenta: con el mismo tope se volvería a
 * cortar y se cobraría otra vez.
 */
export class TruncatedAnalysisOutputError extends InvalidAnalysisOutputError {}
