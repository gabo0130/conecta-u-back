import type { EmbeddingProvider } from '../../src/domain/repositories/embedding-provider.interface';
import { FakeEmbeddingProvider } from '../../src/infrastructure/ai/fake-embedding-provider';
import { runEvaluation, toMarkdown } from './evaluation';

// Evaluación sintética (T9): reproducible y marcada como simulación.
describe('runEvaluation (simulación)', () => {
  const options = { count: 60, seed: 7, ks: [5, 10] };

  it('misma semilla → mismo resultado', async () => {
    const [a, b] = await Promise.all([runEvaluation(options), runEvaluation(options)]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const other = await runEvaluation({ ...options, seed: 8 });
    expect(JSON.stringify(other.cases)).not.toBe(JSON.stringify(a.cases));
  });

  it('queda marcada como simulación y supera a la línea base aleatoria', async () => {
    const result = await runEvaluation(options);
    expect(result.simulation).toBe(true);
    expect(result.dataset).toMatchObject({ people: 60, needs: 20 });
    expect(result.cases).toHaveLength(result.dataset.profiles);
    const hybrid = result.summary.hibrido['@10'];
    const random = result.summary.aleatorio['@10'];
    expect(hybrid.ndcg!).toBeGreaterThan(random.ndcg!);
    expect(hybrid.precision!).toBeGreaterThan(random.precision!);
    for (const item of result.cases) {
      expect(item.rankings.hibrido.length).toBeLessThanOrEqual(10);
    }

    const markdown = toMarkdown(result);
    expect(markdown).toContain('SIMULACIÓN');
    expect(markdown).toContain('### K = 5');
    expect(markdown).toContain('### K = 10');
  });

  it('usa el proveedor de embeddings que recibe (p. ej. Gemini)', async () => {
    const fake = new FakeEmbeddingProvider(768);
    const embedder: EmbeddingProvider = {
      model: 'probe-model',
      dimensions: 768,
      embed: jest.fn((texts: string[]) => fake.embed(texts)),
    } as unknown as EmbeddingProvider;
    const result = await runEvaluation({ ...options, count: 20 }, embedder);
    expect(result.settings.embedding).toBe('probe-model');
    expect(embedder.embed).toHaveBeenCalled();
  });
});
