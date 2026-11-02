import { NotFoundException } from '@nestjs/common';
import { DeleteMyExperienceUseCase } from './delete-my-experience.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import {
  buildCollaborator,
  buildExperience,
  createFakeCertificateFiles,
  createMock,
} from '../../testing/test-doubles.testing';

describe('DeleteMyExperienceUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const experienceRepository = createMock<ExperienceRepository>();
  const { files, storage, repository } = createFakeCertificateFiles();
  const useCase = new DeleteMyExperienceUseCase(
    collaboratorRepository,
    experienceRepository,
    files,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ experiences: [buildExperience()] }),
    );
  });

  it('deletes an owned experience and then its certificate file', async () => {
    repository.find.mockResolvedValue({
      fileName: 'c.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
      uploadedAt: new Date(),
      storageKey: 'key-1',
    });
    await useCase.execute('user-1', 'exp-1');

    expect(experienceRepository.delete).toHaveBeenCalledWith('exp-1');
    expect(storage.delete).toHaveBeenCalledWith('key-1');
  });

  it('returns 404 for an experience of another collaborator', async () => {
    await expect(
      useCase.execute('user-1', 'foreign-exp'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(experienceRepository.delete).not.toHaveBeenCalled();
  });
});
