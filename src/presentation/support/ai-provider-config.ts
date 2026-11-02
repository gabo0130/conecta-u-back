import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { QuotaCircuitBreaker } from '../../infrastructure/ai/quota-circuit-breaker';
import type { GeminiAnalyzerOptions } from '../../infrastructure/ai/gemini-project-analyzer';

const DEFAULT_MODEL = 'gemini-3.8-flash';
const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash-lite';

const logger = new Logger('AiProviderConfig');

/** `AI_PROVIDER=gemini` usa la API real; cualquier otro valor, o ninguno, los adaptadores fake. */
export function useGemini(config: ConfigService): boolean {
  const provider = config.get<string>('AI_PROVIDER') ?? 'fake';
  if (provider !== 'gemini' && provider !== 'fake') {
    logger.warn(
      `AI_PROVIDER="${provider}" no es válido (gemini|fake): se usa el proveedor fake.`,
    );
  }
  return provider === 'gemini';
}

/** `GEMINI_FALLBACK_MODEL` vacío desactiva el respaldo. */
const fallbackModelOf = (config: ConfigService): string | undefined =>
  (config.get<string>('GEMINI_FALLBACK_MODEL') ?? DEFAULT_FALLBACK_MODEL) ||
  undefined;

/** Opciones de los adaptadores de Gemini que generan JSON (exige `GEMINI_API_KEY`). */
export function geminiGeneratorOptions(
  config: ConfigService,
  quotaBreaker: QuotaCircuitBreaker,
): GeminiAnalyzerOptions {
  return {
    apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
    model: config.get<string>('GEMINI_MODEL') ?? DEFAULT_MODEL,
    fallbackModel: fallbackModelOf(config),
    quotaBreaker,
  };
}
