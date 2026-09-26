import { NotFoundException } from '@nestjs/common';
import { DeleteMyExperienceUseCase } from './delete-my-experience.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import {
  buildCollaborator,
  buildExperience,
  createMock,
} from '../../testing/test-doubles.testing';

describe('DeleteMyExperienceUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const experienceRepository = createMock<ExperienceRepository>();
  const useCase = new DeleteMyExperienceUseCase(
    collaboratorRepository,
    experienceRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ experiences: [buildExperience()] }),
    );
  });

  it('deletes an owned experience', async () => {
    await useCase.execute('user-1', 'exp-1');

    expect(experienceRepository.delete).toHaveBeenCalledWith('exp-1');
  });

  it('returns 404 for an experience of another collaborator', async () => {
    await expect(
      useCase.execute('user-1', 'foreign-exp'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(experienceRepository.delete).not.toHaveBeenCalled();
  });
});
