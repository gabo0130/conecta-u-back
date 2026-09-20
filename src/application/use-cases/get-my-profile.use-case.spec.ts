import { NotFoundException } from '@nestjs/common';
import { GetMyProfileUseCase } from './get-my-profile.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import { UserEntity } from '../../domain/entities/user.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

describe('GetMyProfileUseCase', () => {
  const userRepository: jest.Mocked<Pick<UserRepository, 'findById'>> = {
    findById: jest.fn(),
  };
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };

  const useCase = new GetMyProfileUseCase(
    userRepository,
    collaboratorRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns combined user and collaborator profile', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity(
        '1',
        'Ana',
        'ana@example.com',
        'x',
        'COLABORADOR',
        'sistemas',
      ),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(
      new CollaboratorEntity(
        '1',
        'Frontend dev',
        'DISPONIBLE',
        '10-15',
        'Remoto',
        [new SkillEntity('s1', '1', 'React', 'CONOCIMIENTO', null)],
        [new ExperienceEntity('e1', '1', 'Dev', null, null, null)],
        'Grupo A',
      ),
    );

    const result = await useCase.execute('1');

    expect(result).toEqual({
      id: '1',
      fullName: 'Ana',
      email: 'ana@example.com',
      program: 'sistemas',
      headline: 'Frontend dev',
      studyGroup: 'Grupo A',
      availabilityStatus: 'DISPONIBLE',
      weeklyHours: '10-15',
      modality: 'Remoto',
      skills: [{ id: 's1', name: 'React', type: 'CONOCIMIENTO', level: null }],
      experiences: [
        {
          id: 'e1',
          title: 'Dev',
          organization: null,
          period: null,
          description: null,
        },
      ],
    });
  });

  it('throws NotFoundException when user is missing', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('99')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when collaborator profile is missing', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('1', 'Ana', 'ana@example.com', 'x', 'COLABORADOR'),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
