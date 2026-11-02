import type { AnalyzeOptions } from '../../domain/repositories/project-analyzer.interface';
import type { AnalyzerResponse } from '../../domain/repositories/project-analyzer.interface';
import type {
  CharacterizationInput,
  NeedCharacterizer,
} from '../../domain/repositories/need-characterizer.interface';
import type { GeminiAnalyzerOptions } from './gemini-project-analyzer';
import { GeminiJsonGenerator } from './gemini-json-generator';
import {
  buildCharacterizationPrompt,
  CHARACTERIZATION_PROMPT_VERSION,
  CHARACTERIZATION_RESPONSE_SCHEMA,
  CHARACTERIZATION_SYSTEM_INSTRUCTION,
} from './need-characterization-prompt';

/** La respuesta es corta (unas frases y listas), pero incluye los tokens de razonamiento. */
const MAX_OUTPUT_TOKENS = 8192;

/** Caracterización de necesidades con Gemini (tesis, T2): mismo cliente que el análisis. */
export class GeminiNeedCharacterizer implements NeedCharacterizer {
  readonly provider = 'gemini';
  readonly promptVersion = CHARACTERIZATION_PROMPT_VERSION;

  private readonly generator: GeminiJsonGenerator;

  constructor(options: GeminiAnalyzerOptions) {
    this.generator = new GeminiJsonGenerator({
      ...options,
      logContext: 'GeminiNeedCharacterizer',
    });
  }

  get model(): string {
    return this.generator.model;
  }

  isAvailable(): boolean {
    return this.generator.isAvailable();
  }

  characterize(
    input: CharacterizationInput,
    { timeoutMs }: AnalyzeOptions,
  ): Promise<AnalyzerResponse> {
    return this.generator.generate(
      {
        contents: buildCharacterizationPrompt(input),
        systemInstruction: CHARACTERIZATION_SYSTEM_INSTRUCTION,
        responseSchema: CHARACTERIZATION_RESPONSE_SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      timeoutMs,
    );
  }
}
