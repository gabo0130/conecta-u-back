import type { NeedKind } from '../entities/need';
import type { SkillType } from '../entities/skill-type.type';
import type {
  AnalyzeOptions,
  AnalyzerResponse,
} from './project-analyzer.interface';

/**
 * Lo que se le entrega a la IA para caracterizar una necesidad: el texto (sin datos de
 * contacto), el catálogo de habilidades y los tipos de proyecto. Nunca datos del formulador.
 */
export interface CharacterizationInput {
  need: {
    title: string;
    description: string;
    kind: NeedKind;
    dependency: string | null;
    hasDeadline: boolean;
  };
  /** Habilidades ACTIVAS del catálogo, para que la IA elija nombres de esta lista. */
  catalog: { name: string; type: SkillType }[];
  projectTypes: { code: string; name: string }[];
}

/**
 * Caracterizador de necesidades (tesis, T2). Igual que `ProjectAnalyzer`: responde el JSON tal
 * como llegó (lo valida el caso de uso) y lanza `AnalyzerUnavailableError` si el servicio no
 * responde, agota la cuota o tarda demasiado.
 */
export interface NeedCharacterizer {
  readonly provider: string;
  readonly model: string;
  /** Versión del prompt, para poder explicar un resultado pasado (RNF8). */
  readonly promptVersion: string;
  isAvailable(): boolean;
  characterize(
    input: CharacterizationInput,
    options: AnalyzeOptions,
  ): Promise<AnalyzerResponse>;
}
