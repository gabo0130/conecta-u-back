import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { AdminEmbeddingsController } from './admin-embeddings.controller';
import { RequiredProfilesController } from './required-profiles.controller';

const mockUseCase = () => ({ execute: jest.fn() });

describe('RequiredProfilesController', () => {
  const createUseCase = mockUseCase();
  const updateUseCase = mockUseCase();
  const controller = new RequiredProfilesController(
    createUseCase as never,
    updateUseCase as never,
  );
  const request = {
    user: { userId: 'leader-1', role: 'LIDER' },
  } as AuthenticatedRequest;

  beforeEach(() => jest.clearAllMocks());

  it('delegates create with the leader id', () => {
    const dto = {
      name: 'Frontend',
      quantity: 1,
      priority: 'ALTA' as const,
      skills: [],
    };

    void controller.create(request, 'p1', dto);

    expect(createUseCase.execute).toHaveBeenCalledWith('leader-1', 'p1', dto);
  });

  it('delegates update with project and profile ids', () => {
    void controller.update(request, 'p1', 'rp1', { active: false });

    expect(updateUseCase.execute).toHaveBeenCalledWith(
      'leader-1',
      'p1',
      'rp1',
      {
        active: false,
      },
    );
  });
});

describe('AdminEmbeddingsController', () => {
  const rebuildUseCase = mockUseCase();
  const controller = new AdminEmbeddingsController(rebuildUseCase as never);

  it('delegates rebuild with the options sent', () => {
    void controller.rebuild({ force: true, limit: 10 });

    expect(rebuildUseCase.execute).toHaveBeenCalledWith({
      force: true,
      limit: 10,
    });
  });
});
