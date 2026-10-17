import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { RecommendationsController } from './recommendations.controller';

const mockUseCase = () => ({ execute: jest.fn() });

describe('RecommendationsController', () => {
  const generate = mockUseCase();
  const list = mockUseCase();
  const detail = mockUseCase();
  const controller = new RecommendationsController(
    generate as never,
    list as never,
    detail as never,
  );
  const leader = {
    user: { userId: 'leader-1', role: 'LIDER' },
  } as AuthenticatedRequest;
  const admin = {
    user: { userId: 'admin-1', role: 'ADMIN' },
  } as AuthenticatedRequest;

  beforeEach(() => jest.clearAllMocks());

  it('delegates generation with the leader id and the options', () => {
    void controller.generate(leader, 'p1', { includeUnavailable: true });

    expect(generate.execute).toHaveBeenCalledWith('leader-1', 'p1', {
      includeUnavailable: true,
    });
  });

  it('passes the actor role when listing', () => {
    const query = { profileId: 'rp1' };

    void controller.list(admin, 'p1', query);

    expect(list.execute).toHaveBeenCalledWith(
      { userId: 'admin-1', role: 'ADMIN' },
      'p1',
      query,
    );
  });

  it('delegates the detail with project and recommendation ids', () => {
    void controller.detail(leader, 'p1', 'rec1');

    expect(detail.execute).toHaveBeenCalledWith(
      { userId: 'leader-1', role: 'LIDER' },
      'p1',
      'rec1',
    );
  });
});
