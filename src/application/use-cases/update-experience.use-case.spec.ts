import { NotFoundException } from '@nestjs/common';
import { UpdateExperienceUseCase } from './update-experience.use-case';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';

describe('UpdateExperienceUseCase', () => {
  const experienceRepository: jest.Mocked<
    Pick<ExperienceRepository, 'findById' | 'update'>
  > = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new UpdateExperienceUseCase(experienceRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the experience when owned by the collaborator', async () => {
    experienceRepository.findById.mockResolvedValue(
      new ExperienceEntity('e1', '1', 'Dev', null, null, null),
    );
    experienceRepository.update.mockResolvedValue(
      new ExperienceEntity('e1', '1', 'Senior Dev', null, null, null),
    );

    const result = await useCase.execute('1', 'e1', { title: 'Senior Dev' });

    expect(result.title).toBe('Senior Dev');
  });

  it('throws NotFoundException when experience does not exist', async () => {
    experienceRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('1', 'e1', { title: 'Dev' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when experience belongs to another collaborator', async () => {
    experienceRepository.findById.mockResolvedValue(
      new ExperienceEntity('e1', '2', 'Dev', null, null, null),
    );

    await expect(
      useCase.execute('1', 'e1', { title: 'Dev' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
