import type { Repository } from 'typeorm';
import { OrmUtils } from 'typeorm/util/OrmUtils';
import type { ProjectOrmEntity } from './project.orm-entity';
import type { SkillOrmEntity } from './skill.orm-entity';
import { TypeOrmProjectRepository } from './typeorm-project.repository';

// merge() real de TypeORM: combina los arreglos por posición, que es lo que causaba
// entregables duplicados y habilidades que no se podían quitar.
const realMerge = (target: object, ...sources: object[]) =>
  OrmUtils.mergeDeep(target, ...sources);

function setup() {
  const loaded = {
    id: 'p1',
    title: 'Proyecto',
    knownSkills: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    deliverables: [
      { id: 'd1', name: 'E1', scope: 'uno' },
      { id: 'd2', name: 'E2', scope: 'dos' },
    ],
  };
  const save = jest.fn((entity: ProjectOrmEntity) => Promise.resolve(entity));
  const repository = {
    findOne: jest.fn().mockResolvedValue(loaded),
    merge: jest.fn(realMerge),
    save,
    manager: {
      getRepository: () => ({ create: (data: object) => ({ ...data }) }),
    },
  } as unknown as Repository<ProjectOrmEntity>;
  const skillRepository = {
    find: jest.fn().mockResolvedValue([{ id: 'a' }]),
  } as unknown as Repository<SkillOrmEntity>;
  const projects = new TypeOrmProjectRepository(repository, skillRepository);
  jest.spyOn(projects, 'findById').mockResolvedValue(null);
  const saved = () => save.mock.calls[0][0];
  return { projects, saved };
}

describe('TypeOrmProjectRepository.update', () => {
  it('replaces the deliverables instead of appending them to the stored ones', async () => {
    const { projects, saved } = setup();

    await projects.update('p1', {
      deliverables: [
        { name: 'E1', scope: 'uno' },
        { name: 'E2', scope: 'dos' },
        { name: 'E3', scope: 'tres' },
      ],
    });

    expect(saved().deliverables).toEqual([
      { name: 'E1', scope: 'uno' },
      { name: 'E2', scope: 'dos' },
      { name: 'E3', scope: 'tres' },
    ]);
  });

  it('drops the known skills that are no longer sent', async () => {
    const { projects, saved } = setup();

    await projects.update('p1', { knownSkillIds: ['a'] });

    expect(saved().knownSkills).toEqual([{ id: 'a' }]);
  });

  it('keeps relations untouched when the payload does not include them', async () => {
    const { projects, saved } = setup();

    await projects.update('p1', { title: 'Nuevo título' });

    expect(saved().title).toBe('Nuevo título');
    expect(saved().knownSkills).toHaveLength(3);
    expect(saved().deliverables).toHaveLength(2);
  });
});
