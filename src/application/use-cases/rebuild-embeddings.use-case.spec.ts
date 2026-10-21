import type { CollaboratorEmbeddingService } from '../analysis/collaborator-embedding.service';
import type { ProfileEmbedder } from '../analysis/profile-embedder';
import { createMock } from '../../testing/test-doubles.testing';
import { RebuildEmbeddingsUseCase } from './rebuild-embeddings.use-case';

describe('RebuildEmbeddingsUseCase', () => {
  const service = createMock<CollaboratorEmbeddingService>();
  const profileEmbedder = createMock<ProfileEmbedder>();
  const useCase = new RebuildEmbeddingsUseCase(service, profileEmbedder);
  const summary = { processed: 3, skipped: 0, failed: 0, remaining: 0 };
  const profiles = { processed: 2, failed: 0, remaining: 0 };

  beforeEach(() => {
    jest.resetAllMocks();
    service.rebuildStale.mockResolvedValue(summary);
    profileEmbedder.rebuildStale.mockResolvedValue(profiles);
  });

  it('rebuilds the pending embeddings of people and required profiles', async () => {
    const result = await useCase.execute({});

    expect(service.markAllStale).not.toHaveBeenCalled();
    expect(profileEmbedder.markAllStale).not.toHaveBeenCalled();
    expect(service.rebuildStale).toHaveBeenCalledWith(200);
    expect(profileEmbedder.rebuildStale).toHaveBeenCalledWith(200);
    expect(result).toEqual({ ...summary, requiredProfiles: profiles });
  });

  it('invalidates everything first when forced, including the required profiles', async () => {
    await useCase.execute({ force: true, limit: 50 });

    expect(service.markAllStale).toHaveBeenCalled();
    expect(profileEmbedder.markAllStale).toHaveBeenCalled();
    expect(service.rebuildStale).toHaveBeenCalledWith(50);
    expect(profileEmbedder.rebuildStale).toHaveBeenCalledWith(50);
  });
});
