import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';
import { GeminiEmbeddingProvider } from '../../src/infrastructure/ai/gemini-embedding-provider';
import { DEFAULT_OPTIONS, EMBEDDING_DIMENSIONS, runEvaluation, toMarkdown } from './evaluation';

// Evaluación offline del recomendador con datos sintéticos (SIMULACIÓN, tesis Fase 4 DSR).
// No usa base de datos ni red. Misma semilla → mismos archivos.
//   npx ts-node scripts/synthetic/evaluate-recommender.ts [--count 150] [--seed 20261102] [--k 5,10]
//     [--out docs/tesis/evaluacion-sintetica] [--embeddings fake|gemini]
// `--embeddings gemini` usa la API real (exige GEMINI_API_KEY; ~200 textos por corrida) y escribe
// en `<out>/gemini` para no pisar la corrida reproducible sin red.

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const options = {
    count: Number(arg('count') ?? DEFAULT_OPTIONS.count),
    seed: Number(arg('seed') ?? DEFAULT_OPTIONS.seed),
    ks: (arg('k') ?? DEFAULT_OPTIONS.ks.join(',')).split(',').map(Number),
  };
  const gemini = arg('embeddings') === 'gemini';
  const base = arg('out') ?? join(__dirname, '..', '..', 'docs', 'tesis', 'evaluacion-sintetica');
  const out = gemini ? join(base, 'gemini') : base;
  const embedder = gemini
    ? new GeminiEmbeddingProvider({
        apiKey: process.env.GEMINI_API_KEY ?? '',
        model: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
        dimensions: EMBEDDING_DIMENSIONS,
        timeoutMs: 30_000,
      })
    : undefined;
  if (gemini && !process.env.GEMINI_API_KEY) throw new Error('Define GEMINI_API_KEY para usar --embeddings gemini');
  const result = await runEvaluation(options, embedder);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'resultados-evaluacion-sintetica.json'), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(join(out, 'resultados-evaluacion-sintetica.md'), toMarkdown(result));
  for (const k of options.ks) {
    console.log(`K=${k}`, JSON.stringify(Object.fromEntries(Object.entries(result.summary).map(([system, rows]) => [system, rows[`@${k}`]]))));
  }
  console.log(`Escrito en ${out} (SIMULACIÓN, datos sintéticos).`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
