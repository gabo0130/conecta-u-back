import { NotFoundException } from '@nestjs/common';
import { ListMyCollaboratorSkillsUseCase } from './list-my-collaborator-skills.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  createMock,
} from '../../testing/test-doubles.testing';

describe('ListMyCollaboratorSkillsUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const useCase = new ListMyCollaboratorSkillsUseCase(collaboratorRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists the collaborator skills', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ skills: [buildCollaboratorSkill()] }),
    );

    await expect(useCase.execute('user-1')).resolves.toEqual({
      skills: [
        {
          id: 'entry-1',
          skill: {
            id: 'skill-1',
            name: 'React',
            type: 'CONOCIMIENTO',
            category: 'FRAMEWORK',
          },
          level: 'AVANZADO',
          experienceMonths: 24,
          lastUsedYear: 2025,
        },
      ],
    });
  });

  it('throws NotFoundException when the user has no profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
