import { NotFoundException } from '@nestjs/common';
import { GetMyCollaboratorProfileUseCase } from './get-my-collaborator-profile.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  buildExperience,
  createMock,
} from '../../testing/test-doubles.testing';

describe('GetMyCollaboratorProfileUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const useCase = new GetMyCollaboratorProfileUseCase(collaboratorRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the profile with skills and experience', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({
        skills: [buildCollaboratorSkill()],
        experiences: [buildExperience()],
      }),
    );

    const result = await useCase.execute('user-1');

    expect(result.skills[0].skill.name).toBe('React');
    expect(result.experiences[0]).toEqual(
      expect.objectContaining({
        durationMonths: 6,
        technologies: [{ id: 'skill-1', name: 'React' }],
      }),
    );
  });

  it('throws NotFoundException when the user has no profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
