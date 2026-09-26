import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateMyCollaboratorSkillUseCase } from './update-my-collaborator-skill.use-case';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { CollaboratorSkillDto } from '../dto/collaborator-skill.dto';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  buildSkill,
  createMock,
} from '../../testing/test-doubles.testing';

describe('UpdateMyCollaboratorSkillUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const skillRepository = createMock<SkillRepository>();
  const collaboratorSkillRepository = createMock<CollaboratorSkillRepository>();
  const useCase = new UpdateMyCollaboratorSkillUseCase(
    collaboratorRepository,
    skillRepository,
    collaboratorSkillRepository,
  );

  const dto: CollaboratorSkillDto = {
    skillId: 'skill-1',
    level: 'EXPERTO',
    experienceMonths: 48,
    lastUsedYear: 2026,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({
        skills: [
          buildCollaboratorSkill(),
          buildCollaboratorSkill({
            id: 'entry-2',
            skill: buildSkill({ id: 'skill-2', name: 'Docker' }),
          }),
        ],
      }),
    );
    skillRepository.findById.mockResolvedValue(buildSkill());
    collaboratorSkillRepository.update.mockResolvedValue(
      buildCollaboratorSkill(),
    );
  });

  it('updates an owned entry', async () => {
    const result = await useCase.execute('user-1', 'entry-1', dto);

    expect(collaboratorSkillRepository.update).toHaveBeenCalledWith(
      'entry-1',
      dto,
    );
    expect(result.id).toBe('entry-1');
  });

  it('returns 404 for an entry of another collaborator', async () => {
    await expect(
      useCase.execute('user-1', 'foreign-entry', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(collaboratorSkillRepository.update).not.toHaveBeenCalled();
  });

  it('rejects switching to a skill already registered in another entry', async () => {
    await expect(
      useCase.execute('user-1', 'entry-2', dto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a skill that is not in the catalog', async () => {
    skillRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', 'entry-1', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when the entry disappears while updating', async () => {
    collaboratorSkillRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', 'entry-1', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
