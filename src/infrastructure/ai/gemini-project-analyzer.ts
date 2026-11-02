import type {
  AnalysisInput,
  AnalyzeOptions,
  AnalyzerResponse,
  ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';
import {
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_RESPONSE_SCHEMA,
  ANALYSIS_SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
} from './gemini-prompt';
import {
  GeminiJsonGenerator,
  type GeminiJsonGeneratorOptions,
} from './gemini-json-generator';

export type GeminiAnalyzerOptions = Omit<
  GeminiJsonGeneratorOptions,
  'logContext'
>;

// Incluye los tokens de razonamiento: con poco margen el JSON podría cortarse a la mitad.
const MAX_OUTPUT_TOKENS = 16384;

/**
 * Análisis con Gemini (RF8): salida JSON estructurada. La llamada, el modelo de respaldo y el
 * manejo de cuota viven en `GeminiJsonGenerator`.
 */
export class GeminiProjectAnalyzer implements ProjectAnalyzer {
  readonly provider = 'gemini';
  readonly promptVersion = ANALYSIS_PROMPT_VERSION;

  private readonly generator: GeminiJsonGenerator;

  constructor(options: GeminiAnalyzerOptions) {
    this.generator = new GeminiJsonGenerator({
      ...options,
      logContext: 'GeminiProjectAnalyzer',
    });
  }

  get model(): string {
    return this.generator.model;
  }

  isAvailable(): boolean {
    return this.generator.isAvailable();
  }

  analyze(
    input: AnalysisInput,
    { timeoutMs }: AnalyzeOptions,
  ): Promise<AnalyzerResponse> {
    return this.generator.generate(
      {
        contents: buildAnalysisPrompt(input),
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseSchema: ANALYSIS_RESPONSE_SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      timeoutMs,
    );
  }
}
