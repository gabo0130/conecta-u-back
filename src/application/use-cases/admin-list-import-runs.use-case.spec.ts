import { AdminListImportRunsUseCase } from './admin-list-import-runs.use-case';
import { ImportRunEntity } from '../../domain/entities/import-run.entity';
import type { ImportRunRepository } from '../../domain/repositories/import-run.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { buildUser, createMock } from '../../testing/test-doubles.testing';

const buildRun = (overrides: Partial<{ id: string; importedByUserId: string | null }> = {}) =>
  new ImportRunEntity(
    overrides.id ?? 'run-1',
    'colaboradores.xlsx',
    'importedByUserId' in overrides ? (overrides.importedByUserId as string | null) : 'admin-1',
    2,
    1,
    [{ sheet: 'Colaboradores', row: 2, email: 'a@b.co', reason: 'disponibilidad inválida' }],
    [],
    new Date('2026-01-01'),
  );

describe('AdminListImportRunsUseCase', () => {
  const importRunRepository = createMock<ImportRunRepository>();
  const userRepository = createMock<UserRepository>();
  const useCase = new AdminListImportRunsUseCase(importRunRepository, userRepository);

  beforeEach(() => jest.clearAllMocks());

  it('pages the runs and resolves who imported each one', async () => {
    importRunRepository.findAll.mockResolvedValue({
      items: [buildRun({ id: 'run-1', importedByUserId: 'admin-1' })],
      total: 1,
    });
    userRepository.findByIds.mockResolvedValue([
      buildUser({ id: 'admin-1', fullName: 'Rita Admin' }),
    ]);

    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result).toEqual({
      runs: [
        {
          id: 'run-1',
          fileName: 'colaboradores.xlsx',
          createdAt: new Date('2026-01-01'),
          importedBy: expect.objectContaining({ id: 'admin-1', fullName: 'Rita Admin' }),
          created: 2,
          rejectedCount: 1,
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    expect(userRepository.findByIds).toHaveBeenCalledWith(['admin-1']);
  });

  it('does not query users when no run has an admin (deleted account)', async () => {
    importRunRepository.findAll.mockResolvedValue({
      items: [buildRun({ importedByUserId: null })],
      total: 1,
    });
    userRepository.findByIds.mockResolvedValue([]);

    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result.runs[0].importedBy).toBeNull();
    expect(userRepository.findByIds).toHaveBeenCalledWith([]);
  });
});
