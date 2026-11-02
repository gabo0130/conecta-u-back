import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalFileStorage } from './local-file-storage';

describe('LocalFileStorage', () => {
  let root: string;
  let storage: LocalFileStorage;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'conecta-storage-'));
    storage = new LocalFileStorage(root);
  });

  afterEach(() => rm(root, { recursive: true, force: true }));

  it('stores, reads and deletes a file', async () => {
    const content = Buffer.from('%PDF-1.7');
    await storage.put('certificates/c1/a.pdf', content);
    await expect(storage.get('certificates/c1/a.pdf')).resolves.toEqual(
      content,
    );
    await storage.delete('certificates/c1/a.pdf');
    await expect(storage.get('certificates/c1/a.pdf')).resolves.toBeNull();
  });

  it('ignores deleting a missing file', async () => {
    await expect(storage.delete('certificates/nada.pdf')).resolves.toBe(
      undefined,
    );
  });

  it('never leaves the root folder', async () => {
    await expect(storage.get('../fuera.txt')).rejects.toThrow(
      'Clave de almacenamiento no válida',
    );
  });
});
