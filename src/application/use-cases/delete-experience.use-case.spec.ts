import { NotFoundException } from '@nestjs/common';
import { DeleteExperienceUseCase } from './delete-experience.use-case';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';

describe('DeleteExperienceUseCase', () => {
  const experienceRepository: jest.Mocked<
    Pick<ExperienceRepository, 'findById' | 'delete'>
  > = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const useCase = new DeleteExperienceUseCase(experienceRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the experience when owned by the collaborator', async () => {
    experienceRepository.findById.mockResolvedValue(
      new ExperienceEntity('e1', '1', 'Dev', null, null, null),
    );
    experienceRepository.delete.mockResolvedValue(true);

    await useCase.execute('1', 'e1');

    expect(experienceRepository.delete).toHaveBeenCalledWith('e1');
  });

  it('throws NotFoundException when experience belongs to another collaborator', async () => {
    experienceRepository.findById.mockResolvedValue(
      new ExperienceEntity('e1', '2', 'Dev', null, null, null),
    );

    await expect(useCase.execute('1', 'e1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
