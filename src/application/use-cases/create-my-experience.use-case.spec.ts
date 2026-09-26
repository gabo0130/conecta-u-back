import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateMyExperienceUseCase } from './create-my-experience.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { ExperienceDto } from '../dto/experience.dto';
import {
  buildCollaborator,
  buildExperience,
  buildSkill,
  createMock,
} from '../../testing/test-doubles.testing';

describe('CreateMyExperienceUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const experienceRepository = createMock<ExperienceRepository>();
  const skillRepository = createMock<SkillRepository>();
  const useCase = new CreateMyExperienceUseCase(
    collaboratorRepository,
    experienceRepository,
    skillRepository,
  );

  const dto: ExperienceDto = {
    type: 'LABORAL',
    role: 'Desarrolladora',
    organization: 'UFPS',
    startDate: '2024-01-01',
    endDate: '2024-07-01',
    current: false,
    weeklyHours: 20,
    level: 'INTERMEDIO',
    skillIds: ['skill-1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());
    skillRepository.findByIds.mockResolvedValue([buildSkill()]);
    experienceRepository.create.mockResolvedValue(buildExperience());
  });

  it('creates the experience and returns it with its duration', async () => {
    const result = await useCase.execute('user-1', dto);

    expect(experienceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collaboratorId: 'collab-1',
        skillIds: ['skill-1'],
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        durationMonths: 6,
        technologies: [{ id: 'skill-1', name: 'React' }],
      }),
    );
  });

  it('rejects technologies that are not in the catalog', async () => {
    skillRepository.findByIds.mockResolvedValue([]);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(experienceRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      useCase.execute('user-1', { ...dto, endDate: '2023-12-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a current experience with an end date', async () => {
    await expect(
      useCase.execute('user-1', { ...dto, current: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a user without profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
