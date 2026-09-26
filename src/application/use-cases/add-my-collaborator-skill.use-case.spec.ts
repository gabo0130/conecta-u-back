import { ConflictException, NotFoundException } from '@nestjs/common';
import { AddMyCollaboratorSkillUseCase } from './add-my-collaborator-skill.use-case';
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

describe('AddMyCollaboratorSkillUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const skillRepository = createMock<SkillRepository>();
  const collaboratorSkillRepository = createMock<CollaboratorSkillRepository>();
  const useCase = new AddMyCollaboratorSkillUseCase(
    collaboratorRepository,
    skillRepository,
    collaboratorSkillRepository,
  );

  const dto: CollaboratorSkillDto = {
    skillId: 'skill-2',
    level: 'INTERMEDIO',
    experienceMonths: 12,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ skills: [buildCollaboratorSkill()] }),
    );
    skillRepository.findById.mockResolvedValue(buildSkill({ id: 'skill-2' }));
  });

  it('adds a catalog skill and returns it in the profile shape', async () => {
    collaboratorSkillRepository.create.mockResolvedValue(
      buildCollaboratorSkill({
        id: 'entry-2',
        skill: buildSkill({ id: 'skill-2', name: 'Docker' }),
      }),
    );

    const result = await useCase.execute('user-1', dto);

    expect(collaboratorSkillRepository.create).toHaveBeenCalledWith({
      collaboratorId: 'collab-1',
      skillId: 'skill-2',
      level: 'INTERMEDIO',
      experienceMonths: 12,
      lastUsedYear: null,
    });
    expect(result.skill).toEqual({
      id: 'skill-2',
      name: 'Docker',
      type: 'CONOCIMIENTO',
      category: 'FRAMEWORK',
    });
  });

  it('rejects a skill the collaborator already has', async () => {
    await expect(
      useCase.execute('user-1', { ...dto, skillId: 'skill-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a skill that is not in the catalog', async () => {
    skillRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a user without profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
