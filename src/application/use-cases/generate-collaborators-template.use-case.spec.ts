import { GenerateCollaboratorsTemplateUseCase } from './generate-collaborators-template.use-case';
import type { CollaboratorTemplateWriter } from '../../domain/repositories/collaborator-workbook.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('GenerateCollaboratorsTemplateUseCase', () => {
  it('returns the template produced by the writer', async () => {
    const templateWriter = createMock<CollaboratorTemplateWriter>();
    const template = Buffer.from('xlsx');
    templateWriter.write.mockResolvedValue(template);

    const useCase = new GenerateCollaboratorsTemplateUseCase(templateWriter);

    await expect(useCase.execute()).resolves.toBe(template);
  });
});
