import { DeliverableEntity } from '../../domain/entities/deliverable.entity';
import { toProjectResponse } from './project-response.mapper';
import { toSkillSummary } from './skill-response.mapper';
import { toSessionUserResponse, toUserResponse } from './user-response.mapper';
import {
  buildProject,
  buildSkill,
  buildUser,
} from '../../testing/test-doubles.testing';

describe('response mappers', () => {
  it('exposes a user without the password hash', () => {
    const response = toUserResponse(
      buildUser({ role: 'LIDER', active: false }),
    );

    expect(response).toEqual({
      id: 'user-1',
      fullName: 'Ana Pérez',
      email: 'ana@example.com',
      role: 'LIDER',
      active: false,
    });
    expect(response).not.toHaveProperty('passwordHash');
  });

  it('adds the role menu to the session user', () => {
    const response = toSessionUserResponse(buildUser({ role: 'ADMIN' }));

    expect(response).toEqual(
      expect.objectContaining({ id: 'user-1', role: 'ADMIN', active: true }),
    );
    expect(response.menu.length).toBeGreaterThan(0);
  });

  it('summarizes a skill without catalog internals', () => {
    expect(toSkillSummary(buildSkill())).toEqual({
      id: 'skill-1',
      name: 'React',
      type: 'CONOCIMIENTO',
      category: 'FRAMEWORK',
    });
  });

  it('exposes a project with summarized skills and deliverables', () => {
    const response = toProjectResponse(
      buildProject({
        knownSkills: [buildSkill()],
        deliverables: [
          new DeliverableEntity('d-1', 'project-1', 'PMV', 'Iteración 1'),
        ],
      }),
    );

    expect(response.knownSkills).toEqual([
      {
        id: 'skill-1',
        name: 'React',
        type: 'CONOCIMIENTO',
        category: 'FRAMEWORK',
      },
    ]);
    expect(response.deliverables).toEqual([
      { id: 'd-1', name: 'PMV', scope: 'Iteración 1' },
    ]);
    expect(response).toEqual(
      expect.objectContaining({ id: 'project-1', leaderId: 'leader-1' }),
    );
  });
});
