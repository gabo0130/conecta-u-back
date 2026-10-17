import type { Repository } from 'typeorm';
import type { CollaboratorSkillOrmEntity } from './collaborator-skill.orm-entity';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { TypeOrmCollaboratorSkillRepository } from './typeorm-collaborator-skill.repository';

const EXISTING = {
  id: 's1',
  collaboratorId: 'c1',
  level: 'BASICO',
  experienceMonths: 3,
  lastUsedYear: null,
  skill: {
    id: 'k1',
    name: 'React',
    normalizedName: 'react',
    type: 'CONOCIMIENTO',
    category: 'FRAMEWORK',
    synonyms: [],
    status: 'ACTIVA',
  },
};

function setup(existing: object | null = { ...EXISTING }) {
  const markStale = jest.fn();
  const repository = {
    manager: { update: markStale },
    findOne: jest.fn().mockResolvedValue(existing),
    create: jest.fn((data: object) => data),
    merge: jest.fn((entry: object, data: object) => Object.assign(entry, data)),
    save: jest.fn((entry: object) => Promise.resolve({ id: 's1', ...entry })),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  } as unknown as Repository<CollaboratorSkillOrmEntity>;
  return {
    skills: new TypeOrmCollaboratorSkillRepository(repository),
    markStale,
  };
}

const STALE = [
  CollaboratorOrmEntity,
  { id: 'c1' },
  { embeddingUpdatedAt: null },
];

describe('TypeOrmCollaboratorSkillRepository embedding invalidation', () => {
  it('marks the embedding stale when a skill is added', async () => {
    const { skills, markStale } = setup();

    await skills.create({
      collaboratorId: 'c1',
      skillId: 'k1',
      level: 'BASICO',
      experienceMonths: 3,
    });

    expect(markStale).toHaveBeenCalledWith(...STALE);
  });

  it('marks it stale when a skill is updated', async () => {
    const { skills, markStale } = setup();

    await skills.update('s1', { level: 'AVANZADO' });

    expect(markStale).toHaveBeenCalledWith(...STALE);
  });

  it('marks it stale when a skill is deleted', async () => {
    const { skills, markStale } = setup();

    await expect(skills.delete('s1')).resolves.toBe(true);

    expect(markStale).toHaveBeenCalledWith(...STALE);
  });

  it('does not touch anything when the skill to delete does not exist', async () => {
    const { skills, markStale } = setup(null);

    await expect(skills.delete('x')).resolves.toBe(false);

    expect(markStale).not.toHaveBeenCalled();
  });
});
