import { createHash } from 'node:crypto';
import type { EmbeddingProvider } from '../../domain/repositories/embedding-provider.interface';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';

/**
 * Embeddings deterministas sin red: cada palabra aporta a una posición del vector (hash),
 * así que textos con palabras en común quedan cerca. Para pruebas y para trabajar sin API key.
 */
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;

  constructor(readonly dimensions: number) {
    this.model = `fake/hash-v1@${dimensions}`;
  }

  embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(texts.map((text) => this.vectorOf(text)));
  }

  private vectorOf(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    for (const word of normalizeSkillName(text).split(' ')) {
      if (word.length < 2) continue;
      const digest = createHash('sha256').update(word).digest();
      const position = digest.readUInt32BE(0) % this.dimensions;
      vector[position] += digest[4] % 2 === 0 ? 1 : -1;
    }
    const norm = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0),
    );
    if (norm === 0) {
      vector[0] = 1;
      return vector;
    }
    return vector.map((value) => value / norm);
  }
}
