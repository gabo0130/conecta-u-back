import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateMyExperienceUseCase } from './update-my-experience.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { ExperienceDto } from '../dto/experience.dto';
import {
  buildCollaborator,
  buildExperience,
  createMock,
} from '../../testing/test-doubles.testing';

describe('UpdateMyExperienceUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const experienceRepository = createMock<ExperienceRepository>();
  const skillRepository = createMock<SkillRepository>();
  const useCase = new UpdateMyExperienceUseCase(
    collaboratorRepository,
    experienceRepository,
    skillRepository,
  );

  const dto: ExperienceDto = {
    type: 'PRACTICA',
    role: 'Practicante',
    organization: 'UFPS',
    startDate: '2025-01-01',
    current: true,
    weeklyHours: 30,
    level: 'AVANZADO',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ experiences: [buildExperience()] }),
    );
    experienceRepository.update.mockResolvedValue(
      buildExperience({ current: true, endDate: null }),
    );
  });

  it('updates an owned experience', async () => {
    const result = await useCase.execute('user-1', 'exp-1', dto);

    expect(experienceRepository.update).toHaveBeenCalledWith(
      'exp-1',
      expect.objectContaining({ role: 'Practicante', endDate: null }),
    );
    expect(result.id).toBe('exp-1');
  });

  it('returns 404 for an experience of another collaborator', async () => {
    await expect(
      useCase.execute('user-1', 'foreign-exp', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(experienceRepository.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid period', async () => {
    await expect(
      useCase.execute('user-1', 'exp-1', { ...dto, endDate: '2025-06-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when the experience disappears while updating', async () => {
    experienceRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', 'exp-1', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
