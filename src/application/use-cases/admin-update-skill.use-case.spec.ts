import { NotFoundException } from '@nestjs/common';
import { AdminUpdateSkillUseCase } from './admin-update-skill.use-case';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { buildSkill, createMock } from '../../testing/test-doubles.testing';

describe('AdminUpdateSkillUseCase', () => {
  const skillRepository = createMock<SkillRepository>();
  const useCase = new AdminUpdateSkillUseCase(skillRepository);

  beforeEach(() => jest.clearAllMocks());

  it('approves a pending skill', async () => {
    skillRepository.update.mockResolvedValue(buildSkill());

    await useCase.execute('skill-1', { status: 'ACTIVA' });

    expect(skillRepository.update).toHaveBeenCalledWith('skill-1', {
      status: 'ACTIVA',
      normalizedName: undefined,
    });
  });

  it('recomputes normalizedName when the name changes', async () => {
    skillRepository.update.mockResolvedValue(buildSkill());

    await useCase.execute('skill-1', { name: 'Programación' });

    expect(skillRepository.update).toHaveBeenCalledWith('skill-1', {
      name: 'Programación',
      normalizedName: 'programacion',
    });
  });

  it('throws 404 when the skill does not exist', async () => {
    skillRepository.update.mockResolvedValue(null);

    await expect(useCase.execute('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
