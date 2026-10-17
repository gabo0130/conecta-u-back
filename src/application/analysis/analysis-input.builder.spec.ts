import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  buildProject,
  buildProjectCategory,
  buildProjectType,
  createMock,
} from '../../testing/test-doubles.testing';
import {
  AnalysisInputBuilder,
  projectFingerprint,
} from './analysis-input.builder';
import { OMITTED_CONTACT } from './contact-data';

function setup() {
  const types = createMock<ProjectTypeRepository>();
  const categories = createMock<ProjectCategoryRepository>();
  const programs = createMock<ProgramRepository>();
  const skills = createMock<SkillRepository>();
  types.findById.mockResolvedValue(
    buildProjectType({
      templateFields: [
        { key: 'grupo', label: 'Grupo', kind: 'text', required: false },
      ],
    }),
  );
  categories.findById.mockResolvedValue(buildProjectCategory());
  skills.findAllActive.mockResolvedValue([]);
  return new AnalysisInputBuilder(types, categories, programs, skills);
}

const projectWithContacts = () =>
  buildProject({
    programId: null,
    summary: 'Sensores IoT. Dudas a lider@ufps.edu.co.',
    objectives:
      'Reducir 30 % el desperdicio entre 2026-2027. Llamar al 3001234567.',
    typeData: { grupo: 'GIDIS, https://gidis.ufps.edu.co' },
    deliverables: [
      { name: 'Prototipo', scope: 'Ver www.prototipo.dev' } as never,
    ],
  });

describe('AnalysisInputBuilder.build (Ley 1581)', () => {
  it('sends the project text to the AI without contact data', async () => {
    const { input } = await setup().build(projectWithContacts());
    const sent = JSON.stringify(input.project);

    expect(sent).not.toMatch(/@|https?:|www\.|3001234567/);
    expect(input.project.summary).toBe(
      `Sensores IoT. Dudas a ${OMITTED_CONTACT}`,
    );
    // Lo que no es contacto se conserva tal cual.
    expect(input.project.objectives).toContain('entre 2026-2027');
  });

  it('fingerprints the original text, the same way GET …/analysis does', async () => {
    const builder = setup();
    const project = projectWithContacts();

    const { fingerprint } = await builder.build(project);

    expect(fingerprint).toBe(
      projectFingerprint(await builder.buildProject(project)),
    );
  });
});
