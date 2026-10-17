import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  buildProject,
  buildRequiredProfile,
  createMock,
} from '../../testing/test-doubles.testing';
import type { ProfileEmbedder } from '../analysis/profile-embedder';
import type {
  CreateRequiredProfileDto,
  UpdateRequiredProfileDto,
} from '../dto/required-profile.dto';
import { CreateRequiredProfileUseCase } from './create-required-profile.use-case';
import { UpdateRequiredProfileUseCase } from './update-required-profile.use-case';

const react = new SkillEntity(
  'k-react',
  'React',
  'react',
  'CONOCIMIENTO',
  'FRAMEWORK',
);
const pending = new SkillEntity(
  'k-new',
  'Nueva',
  'nueva',
  'CONOCIMIENTO',
  'OTRA',
  [],
  'PENDIENTE',
);

const profileOf = (overrides: Partial<{ projectId: string }> = {}) =>
  buildRequiredProfile(overrides);

const createDto = (
  overrides: Partial<CreateRequiredProfileDto> = {},
): CreateRequiredProfileDto => ({
  name: 'Frontend',
  quantity: 1,
  priority: 'ALTA',
  skills: [{ skillId: 'k-react', minLevel: 'INTERMEDIO', importance: 'ALTA' }],
  ...overrides,
});

describe('required profile use cases', () => {
  const projectRepository = createMock<ProjectRepository>();
  const profileRepository = createMock<RequiredProfileRepository>();
  const skillRepository = createMock<SkillRepository>();
  const embedder = createMock<ProfileEmbedder>();

  const create = new CreateRequiredProfileUseCase(
    projectRepository,
    profileRepository,
    skillRepository,
    embedder,
  );
  const update = new UpdateRequiredProfileUseCase(
    projectRepository,
    profileRepository,
    skillRepository,
    embedder,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    projectRepository.findById.mockResolvedValue(
      buildProject({ id: 'project-1', leaderId: 'leader-1' }),
    );
    skillRepository.findByIds.mockResolvedValue([react]);
    embedder.embed.mockResolvedValue([{ vector: [1, 0], model: 'm' }]);
    profileRepository.createManual.mockResolvedValue(profileOf());
    profileRepository.findById.mockResolvedValue(profileOf());
    profileRepository.update.mockResolvedValue(profileOf());
  });

  describe('CreateRequiredProfileUseCase', () => {
    it('creates a manual profile with catalog skills and its embedding', async () => {
      const result = await create.execute('leader-1', 'project-1', createDto());

      expect(profileRepository.createManual).toHaveBeenCalledWith({
        projectId: 'project-1',
        name: 'Frontend',
        description: '',
        justification: '',
        quantity: 1,
        priority: 'ALTA',
        minWeeklyHours: null,
        skills: [
          {
            skillId: 'k-react',
            rawName: 'React',
            type: 'CONOCIMIENTO',
            minLevel: 'INTERMEDIO',
            importance: 'ALTA',
          },
        ],
        embedding: { vector: [1, 0], model: 'm' },
      });
      expect(result).toMatchObject({ id: 'rp1', source: 'MANUAL' });
    });

    it('still creates the profile when the embedding could not be computed', async () => {
      embedder.embed.mockResolvedValue([null]);

      await create.execute('leader-1', 'project-1', createDto());

      expect(
        profileRepository.createManual.mock.calls[0][0].embedding,
      ).toBeNull();
    });

    it('rejects a project that belongs to another leader', async () => {
      await expect(
        create.execute('intruder', 'project-1', createDto()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(profileRepository.createManual).not.toHaveBeenCalled();
    });

    it('rejects a skill that is not in the catalog', async () => {
      skillRepository.findByIds.mockResolvedValue([]);

      await expect(
        create.execute('leader-1', 'project-1', createDto()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a catalog skill that is still pending approval', async () => {
      skillRepository.findByIds.mockResolvedValue([pending]);

      await expect(
        create.execute(
          'leader-1',
          'project-1',
          createDto({
            skills: [
              { skillId: 'k-new', minLevel: 'BASICO', importance: 'BAJA' },
            ],
          }),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects repeated skills', async () => {
      const skill = {
        skillId: 'k-react',
        minLevel: 'BASICO' as const,
        importance: 'ALTA' as const,
      };

      await expect(
        create.execute(
          'leader-1',
          'project-1',
          createDto({ skills: [skill, skill] }),
        ),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('UpdateRequiredProfileUseCase', () => {
    const run = (dto: UpdateRequiredProfileDto, projectId = 'project-1') =>
      update.execute('leader-1', projectId, 'rp1', dto);

    it('discards a profile without recomputing its embedding', async () => {
      await run({ active: false });

      expect(profileRepository.update).toHaveBeenCalledWith(
        'rp1',
        expect.objectContaining({ active: false }),
      );
      expect(embedder.embed).not.toHaveBeenCalled();
      expect(
        profileRepository.update.mock.calls[0][1].embedding,
      ).toBeUndefined();
    });

    it('recomputes the embedding when the name changes, keeping the current skills', async () => {
      await run({ name: 'Frontend senior' });

      expect(embedder.embed).toHaveBeenCalledWith([
        {
          name: 'Frontend senior',
          description: 'Interfaz',
          skills: [{ rawName: 'React' }],
        },
      ]);
      expect(profileRepository.update.mock.calls[0][1].embedding).toEqual({
        vector: [1, 0],
        model: 'm',
      });
    });

    it('replaces the skills and recomputes the embedding', async () => {
      await run({
        skills: [
          { skillId: 'k-react', minLevel: 'EXPERTO', importance: 'MEDIA' },
        ],
      });

      const changes = profileRepository.update.mock.calls[0][1];
      expect(changes.skills).toEqual([
        {
          skillId: 'k-react',
          rawName: 'React',
          type: 'CONOCIMIENTO',
          minLevel: 'EXPERTO',
          importance: 'MEDIA',
        },
      ]);
      expect(embedder.embed).toHaveBeenCalled();
    });

    it('turns an emptied description into an empty string', async () => {
      await run({ description: null });

      expect(profileRepository.update.mock.calls[0][1].description).toBe('');
    });

    it('throws NotFoundException when the profile belongs to another project', async () => {
      profileRepository.findById.mockResolvedValue(
        profileOf({ projectId: 'otro-proyecto' }),
      );

      await expect(run({ active: false })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(profileRepository.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      profileRepository.findById.mockResolvedValue(null);

      await expect(run({ active: false })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a project that belongs to another leader', async () => {
      await expect(
        update.execute('intruder', 'project-1', 'rp1', { active: false }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
