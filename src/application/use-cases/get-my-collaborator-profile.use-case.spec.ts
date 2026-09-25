import { NotFoundException } from '@nestjs/common';
import { GetMyCollaboratorProfileUseCase } from './get-my-collaborator-profile.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { CollaboratorSkillEntity } from '../../domain/entities/collaborator-skill.entity';
import { ExperienceEntity } from '../../domain/entities/experience.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

describe('GetMyCollaboratorProfileUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByUserId'>
  > = {
    findByUserId: jest.fn(),
  };

  const useCase = new GetMyCollaboratorProfileUseCase(collaboratorRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the mapped profile with skills, experiences and durationMonths', async () => {
    const skill = new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO');
    collaboratorRepository.findByUserId.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        'u1',
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
        7,
        'Semillero A',
        'Resumen',
        'https://github.com/ana',
        'DISPONIBLE',
        10,
        true,
        new Date('2026-01-01'),
        'REGISTRO',
        true,
        [new CollaboratorSkillEntity('cs1', 'c1', skill, 'AVANZADO', 12, 2026)],
        [
          new ExperienceEntity(
            'e1',
            'c1',
            'PRACTICA',
            'Dev',
            'Empresa',
            '2025-01-01',
            '2025-07-01',
            false,
            10,
            'INTERMEDIO',
            'Descripción',
            [skill],
          ),
        ],
      ),
    );

    const result = await useCase.execute('u1');

    expect(result.id).toBe('c1');
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].skill.name).toBe('React');
    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0].durationMonths).toBe(6);
  });

  it('throws NotFoundException when the collaborator profile does not exist', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
