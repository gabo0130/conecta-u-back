import { BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AdminImportController } from './admin-import.controller';
import type { AdminGetImportRunUseCase } from '../../application/use-cases/admin-get-import-run.use-case';
import type { AdminListImportRunsUseCase } from '../../application/use-cases/admin-list-import-runs.use-case';
import type { GenerateCollaboratorsTemplateUseCase } from '../../application/use-cases/generate-collaborators-template.use-case';
import type { ImportCollaboratorsUseCase } from '../../application/use-cases/import-collaborators.use-case';
import { createMock } from '../../testing/test-doubles.testing';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

describe('AdminImportController', () => {
  const generateCollaboratorsTemplateUseCase =
    createMock<GenerateCollaboratorsTemplateUseCase>();
  const importCollaboratorsUseCase = createMock<ImportCollaboratorsUseCase>();
  const adminListImportRunsUseCase = createMock<AdminListImportRunsUseCase>();
  const adminGetImportRunUseCase = createMock<AdminGetImportRunUseCase>();

  const controller = new AdminImportController(
    generateCollaboratorsTemplateUseCase,
    importCollaboratorsUseCase,
    adminListImportRunsUseCase,
    adminGetImportRunUseCase,
  );

  const request = {
    user: { userId: 'admin-1', role: 'ADMIN' },
  } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes the generated template as an xlsx download', async () => {
    const buffer = Buffer.from('workbook');
    generateCollaboratorsTemplateUseCase.execute.mockResolvedValue(buffer);
    const set = jest.fn();
    const send = jest.fn();
    const res = { set, send } as unknown as Response;

    await controller.template(res);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
    expect(send).toHaveBeenCalledWith(Buffer.from('workbook'));
  });

  it('delegates import to use case with the file, its name and the admin who uploads it', () => {
    const file = {
      buffer: Buffer.from('x'),
      size: 1,
      originalname: 'carga.xlsx',
    } as Express.Multer.File;
    void controller.import(request, file);
    expect(importCollaboratorsUseCase.execute).toHaveBeenCalledWith(
      file.buffer,
      'carga.xlsx',
      'admin-1',
    );
  });

  it('throws BadRequestException when no file is provided', () => {
    expect(() => controller.import(request, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('delegates the runs list to its use case', () => {
    const query = { page: 1, pageSize: 20 };
    void controller.listRuns(query);
    expect(adminListImportRunsUseCase.execute).toHaveBeenCalledWith(query);
  });

  it('delegates a run detail to its use case', () => {
    void controller.getRun('run-1');
    expect(adminGetImportRunUseCase.execute).toHaveBeenCalledWith('run-1');
  });
});
