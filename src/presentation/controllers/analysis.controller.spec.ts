import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { AnalysisController } from './analysis.controller';

const mockUseCase = () => ({ execute: jest.fn() });

describe('AnalysisController', () => {
  const requestAnalysis = mockUseCase();
  const getAnalysis = mockUseCase();
  const listAnalyses = mockUseCase();

  const controller = new AnalysisController(
    requestAnalysis as never,
    getAnalysis as never,
    listAnalyses as never,
  );

  const leader = {
    user: { userId: 'leader-1', role: 'LIDER' },
  } as AuthenticatedRequest;
  const admin = {
    user: { userId: 'admin-1', role: 'ADMIN' },
  } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates the analysis request with the actor and the force flag', () => {
    void controller.request(admin, 'p1', { force: true });

    expect(requestAnalysis.execute).toHaveBeenCalledWith(
      { userId: 'admin-1', role: 'ADMIN' },
      'p1',
      { force: true },
    );
  });

  it('passes the actor role when reading the latest analysis', () => {
    void controller.getLatest(admin, 'p1');

    expect(getAnalysis.execute).toHaveBeenCalledWith(
      { userId: 'admin-1', role: 'ADMIN' },
      'p1',
    );
  });

  it('delegates the history listing with pagination', () => {
    const query = { page: 2, pageSize: 10 };

    void controller.list(leader, 'p1', query);

    expect(listAnalyses.execute).toHaveBeenCalledWith(
      { userId: 'leader-1', role: 'LIDER' },
      'p1',
      query,
    );
  });
});
