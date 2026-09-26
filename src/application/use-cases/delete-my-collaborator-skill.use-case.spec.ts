import { NotFoundException } from '@nestjs/common';
import { DeleteMyCollaboratorSkillUseCase } from './delete-my-collaborator-skill.use-case';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  createMock,
} from '../../testing/test-doubles.testing';

describe('DeleteMyCollaboratorSkillUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const collaboratorSkillRepository = createMock<CollaboratorSkillRepository>();
  const useCase = new DeleteMyCollaboratorSkillUseCase(
    collaboratorRepository,
    collaboratorSkillRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ skills: [buildCollaboratorSkill()] }),
    );
  });

  it('deletes an owned entry', async () => {
    await useCase.execute('user-1', 'entry-1');

    expect(collaboratorSkillRepository.delete).toHaveBeenCalledWith('entry-1');
  });

  it('returns 404 for an entry of another collaborator', async () => {
    await expect(
      useCase.execute('user-1', 'foreign-entry'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(collaboratorSkillRepository.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when the user has no profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', 'entry-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
