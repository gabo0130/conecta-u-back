import { BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AdminImportController } from './admin-import.controller';
import type { GenerateCollaboratorsTemplateUseCase } from '../../application/use-cases/generate-collaborators-template.use-case';
import type { ImportCollaboratorsUseCase } from '../../application/use-cases/import-collaborators.use-case';
import { createMock } from '../../testing/test-doubles.testing';

describe('AdminImportController', () => {
  const generateCollaboratorsTemplateUseCase =
    createMock<GenerateCollaboratorsTemplateUseCase>();
  const importCollaboratorsUseCase = createMock<ImportCollaboratorsUseCase>();

  const controller = new AdminImportController(
    generateCollaboratorsTemplateUseCase,
    importCollaboratorsUseCase,
  );

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

  it('delegates import to use case when a file is provided', () => {
    const file = {
      buffer: Buffer.from('x'),
      size: 1,
      originalname: 'carga.xlsx',
    } as Express.Multer.File;
    void controller.import(file);
    expect(importCollaboratorsUseCase.execute).toHaveBeenCalledWith(
      file.buffer,
    );
  });

  it('throws BadRequestException when no file is provided', () => {
    expect(() => controller.import(undefined)).toThrow(BadRequestException);
  });
});
