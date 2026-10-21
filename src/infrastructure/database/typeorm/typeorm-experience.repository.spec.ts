import type { Repository } from 'typeorm';
import { OrmUtils } from 'typeorm/util/OrmUtils';
import type { ExperienceOrmEntity } from './experience.orm-entity';
import type { SkillOrmEntity } from './skill.orm-entity';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { TypeOrmExperienceRepository } from './typeorm-experience.repository';

// merge() real de TypeORM: combina los arreglos por posición y conservaba las tecnologías quitadas.
const realMerge = (target: object, ...sources: object[]) =>
  OrmUtils.mergeDeep(target, ...sources);

function setup() {
  const loaded = {
    id: 'e1',
    collaboratorId: 'c1',
    role: 'Dev',
    technologies: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  };
  const save = jest.fn((entity: ExperienceOrmEntity) =>
    Promise.resolve(entity),
  );
  const markStale = jest.fn();
  const repository = {
    manager: { update: markStale },
    findOne: jest.fn().mockResolvedValue(loaded),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    merge: jest.fn(realMerge),
    save,
  } as unknown as Repository<ExperienceOrmEntity>;
  const skillRepository = {
    find: jest.fn().mockResolvedValue([{ id: 'b' }]),
  } as unknown as Repository<SkillOrmEntity>;
  const experiences = new TypeOrmExperienceRepository(
    repository,
    skillRepository,
  );
  jest.spyOn(experiences, 'findById').mockResolvedValue(null);
  const saved = () => save.mock.calls[0][0];
  return { experiences, saved, markStale, repository };
}

describe('TypeOrmExperienceRepository.update', () => {
  it('replaces the technologies with exactly the ones sent', async () => {
    const { experiences, saved } = setup();

    await experiences.update('e1', { skillIds: ['b'] });

    expect(saved().technologies).toEqual([{ id: 'b' }]);
  });

  it('keeps the technologies when the payload does not include them', async () => {
    const { experiences, saved } = setup();

    await experiences.update('e1', { role: 'Senior' });

    expect(saved().role).toBe('Senior');
    expect(saved().technologies).toHaveLength(3);
  });
});

describe('TypeOrmExperienceRepository embedding invalidation', () => {
  it('marks the collaborator embedding stale when an experience changes', async () => {
    const { experiences, markStale } = setup();

    await experiences.update('e1', { role: 'Senior' });

    expect(markStale).toHaveBeenCalledWith(
      CollaboratorOrmEntity,
      { id: 'c1' },
      { embeddingUpdatedAt: null },
    );
  });

  it('marks it stale when an experience is deleted', async () => {
    const { experiences, markStale } = setup();

    await expect(experiences.delete('e1')).resolves.toBe(true);

    expect(markStale).toHaveBeenCalledWith(
      CollaboratorOrmEntity,
      { id: 'c1' },
      { embeddingUpdatedAt: null },
    );
  });

  it('does nothing when the experience to delete does not exist', async () => {
    const { experiences, markStale, repository } = setup();
    (repository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(experiences.delete('x')).resolves.toBe(false);

    expect(markStale).not.toHaveBeenCalled();
  });
});
