// Dobles de prueba compartidos por los specs. El sufijo `.testing.ts` los deja fuera del build.
import { CollaboratorSkillEntity } from '../domain/entities/collaborator-skill.entity';
import {
  CollaboratorEntity,
  type CollaboratorProps,
} from '../domain/entities/collaborator.entity';
import {
  ExperienceEntity,
  type ExperienceProps,
} from '../domain/entities/experience.entity';
import { ProgramEntity } from '../domain/entities/program.entity';
import { ProjectCategoryEntity } from '../domain/entities/project-category.entity';
import { ProjectTypeEntity } from '../domain/entities/project-type.entity';
import {
  ProjectEntity,
  type ProjectProps,
} from '../domain/entities/project.entity';
import { SkillEntity } from '../domain/entities/skill.entity';
import type { TemplateField } from '../domain/entities/template-field.type';
import type { UserRole } from '../domain/entities/user-role.type';
import { UserEntity } from '../domain/entities/user.entity';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../domain/repositories/unit-of-work.interface';

/**
 * Mock tipado de una interfaz: cada método se crea como `jest.fn()` al primer acceso,
 * así el spec solo configura los que usa y el compilador sigue validando las firmas.
 */
export function createMock<T extends object>(): jest.Mocked<T> {
  const methods = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(_target, property) {
      // No es una promesa: evita que `await mock` lo trate como thenable.
      if (property === 'then') return undefined;
      if (!methods.has(property)) methods.set(property, jest.fn());
      return methods.get(property);
    },
  });
}

export interface FakeUnitOfWork {
  unitOfWork: jest.Mocked<UnitOfWork>;
  repositories: {
    [K in keyof TransactionalRepositories]: jest.Mocked<
      TransactionalRepositories[K]
    >;
  };
}

/** `UnitOfWork` que ejecuta el trabajo en el acto con repositorios mock. */
export function createFakeUnitOfWork(): FakeUnitOfWork {
  const repositories: FakeUnitOfWork['repositories'] = {
    users: createMock(),
    collaborators: createMock(),
    collaboratorSkills: createMock(),
    experiences: createMock(),
    skills: createMock(),
  };
  const unitOfWork = createMock<UnitOfWork>();
  unitOfWork.run.mockImplementation((work) => work(repositories));
  return { unitOfWork, repositories };
}

export const buildUser = (
  overrides: Partial<{
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    active: boolean;
  }> = {},
) => {
  const user = {
    id: 'user-1',
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    role: 'COLABORADOR' as UserRole,
    active: true,
    ...overrides,
  };
  return new UserEntity(
    user.id,
    user.fullName,
    user.email,
    'hashed',
    user.role,
    user.active,
  );
};

export const buildSkill = (
  overrides: Partial<{ id: string; name: string }> = {},
) => {
  const { id = 'skill-1', name = 'React' } = overrides;
  return new SkillEntity(
    id,
    name,
    name.toLowerCase(),
    'CONOCIMIENTO',
    'FRAMEWORK',
  );
};

export const buildCollaboratorSkill = (
  overrides: Partial<{
    id: string;
    collaboratorId: string;
    skill: SkillEntity;
  }> = {},
) =>
  new CollaboratorSkillEntity(
    overrides.id ?? 'entry-1',
    overrides.collaboratorId ?? 'collab-1',
    overrides.skill ?? buildSkill(),
    'AVANZADO',
    24,
    2025,
  );

export const buildExperience = (overrides: Partial<ExperienceProps> = {}) =>
  new ExperienceEntity({
    id: 'exp-1',
    collaboratorId: 'collab-1',
    type: 'LABORAL',
    role: 'Desarrolladora',
    organization: 'UFPS',
    startDate: '2024-01-01',
    endDate: '2024-07-01',
    current: false,
    weeklyHours: 20,
    level: 'INTERMEDIO',
    technologies: [buildSkill()],
    ...overrides,
  });

export const buildCollaborator = (overrides: Partial<CollaboratorProps> = {}) =>
  new CollaboratorEntity({
    id: 'collab-1',
    email: 'ana@example.com',
    userId: 'user-1',
    firstName: 'Ana',
    lastName: 'Pérez',
    personType: 'ESTUDIANTE',
    programId: 'program-1',
    ...overrides,
  });

export const buildProgram = (
  overrides: Partial<{ id: string; active: boolean }> = {},
) =>
  new ProgramEntity(
    overrides.id ?? 'program-1',
    '115',
    'Ingeniería de Sistemas',
    'Ingeniería',
    overrides.active ?? true,
  );

export const buildProjectType = (
  overrides: Partial<{
    id: string;
    templateFields: TemplateField[];
    active: boolean;
  }> = {},
) =>
  new ProjectTypeEntity(
    overrides.id ?? 'type-1',
    'CURSO',
    'Curso',
    overrides.templateFields ?? [
      { key: 'asignatura', label: 'Asignatura', kind: 'text', required: true },
    ],
    overrides.active ?? true,
  );

export const buildProjectCategory = (
  overrides: Partial<{ id: string; active: boolean }> = {},
) =>
  new ProjectCategoryEntity(
    overrides.id ?? 'category-1',
    'Desarrollo de software',
    overrides.active ?? true,
  );

export const buildProject = (overrides: Partial<ProjectProps> = {}) =>
  new ProjectEntity({
    id: 'project-1',
    title: 'Conecta U',
    summary: 'Resumen',
    objectives: 'Objetivos',
    typeId: 'type-1',
    categoryId: 'category-1',
    programId: null,
    typeData: { asignatura: 'Seminario III' },
    knownSkills: [],
    deliverables: [],
    leaderId: 'leader-1',
    status: 'BORRADOR',
    ...overrides,
  });
