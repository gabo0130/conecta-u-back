import { NotFoundException } from '@nestjs/common';
import { AdminGetImportRunUseCase } from './admin-get-import-run.use-case';
import { ImportRunEntity } from '../../domain/entities/import-run.entity';
import type { ImportRunRepository } from '../../domain/repositories/import-run.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { buildUser, createMock } from '../../testing/test-doubles.testing';

describe('AdminGetImportRunUseCase', () => {
  const importRunRepository = createMock<ImportRunRepository>();
  const userRepository = createMock<UserRepository>();
  const useCase = new AdminGetImportRunUseCase(
    importRunRepository,
    userRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the run detail with its rejected rows and who imported it', async () => {
    importRunRepository.findById.mockResolvedValue(
      new ImportRunEntity(
        'run-1',
        'colaboradores.xlsx',
        'admin-1',
        1,
        1,
        [
          {
            sheet: 'Habilidades',
            row: 3,
            email: 'a@b.co',
            reason: 'nivel inválido',
          },
        ],
        ['Habilidad nueva creada como pendiente: "Rust"'],
        new Date('2026-01-01'),
      ),
    );
    userRepository.findById.mockResolvedValue(
      buildUser({ id: 'admin-1', fullName: 'Rita Admin' }),
    );

    const detail = await useCase.execute('run-1');

    expect(detail).toEqual({
      id: 'run-1',
      fileName: 'colaboradores.xlsx',
      createdAt: new Date('2026-01-01'),
      importedBy: expect.objectContaining({
        id: 'admin-1',
        fullName: 'Rita Admin',
      }),
      created: 1,
      rejected: [
        {
          sheet: 'Habilidades',
          row: 3,
          email: 'a@b.co',
          reason: 'nivel inválido',
        },
      ],
      warnings: ['Habilidad nueva creada como pendiente: "Rust"'],
    });
  });

  it('returns no importer for a run whose admin account was deleted', async () => {
    importRunRepository.findById.mockResolvedValue(
      new ImportRunEntity(
        'run-1',
        'colaboradores.xlsx',
        null,
        0,
        0,
        [],
        [],
        new Date('2026-01-01'),
      ),
    );

    const detail = await useCase.execute('run-1');

    expect(detail.importedBy).toBeNull();
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('throws 404 when the run does not exist', async () => {
    importRunRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
