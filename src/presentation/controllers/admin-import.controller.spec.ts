import { BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AdminImportController } from './admin-import.controller';

function mockUseCase() {
  return { execute: jest.fn() };
}

describe('AdminImportController', () => {
  const generateCollaboratorsTemplateUseCase = mockUseCase();
  const importCollaboratorsUseCase = mockUseCase();

  const controller = new AdminImportController(
    generateCollaboratorsTemplateUseCase,
    importCollaboratorsUseCase as never,
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
    expect(send).toHaveBeenCalledWith(buffer);
  });

  it('delegates import to use case when a file is provided', () => {
    const file = { buffer: Buffer.from('x'), size: 1 } as Express.Multer.File;
    void controller.import(file);
    expect(importCollaboratorsUseCase.execute).toHaveBeenCalledWith(file);
  });

  it('throws BadRequestException when no file is provided', () => {
    expect(() => controller.import(undefined)).toThrow(BadRequestException);
  });
});
