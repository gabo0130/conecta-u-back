import { CreateExperienceUseCase } from './create-experience.use-case';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';

describe('CreateExperienceUseCase', () => {
  const experienceRepository: jest.Mocked<
    Pick<ExperienceRepository, 'create'>
  > = {
    create: jest.fn(),
  };

  const useCase = new CreateExperienceUseCase(experienceRepository);

  it('creates an experience for the collaborator', async () => {
    experienceRepository.create.mockResolvedValue(
      new ExperienceEntity('e1', '1', 'Dev', 'Acme', '2024', 'desc'),
    );

    const result = await useCase.execute('1', {
      title: 'Dev',
      organization: 'Acme',
      period: '2024',
      description: 'desc',
    });

    expect(experienceRepository.create).toHaveBeenCalledWith({
      collaboratorId: '1',
      title: 'Dev',
      organization: 'Acme',
      period: '2024',
      description: 'desc',
    });
    expect(result.title).toBe('Dev');
  });
});
