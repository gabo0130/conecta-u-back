import type { TemplateField } from '../../domain/entities/template-field.type';
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
import { OMITTED_PERSONAL_DATA } from './contact-data';

function setup(templateFields?: TemplateField[]) {
  const types = createMock<ProjectTypeRepository>();
  const categories = createMock<ProjectCategoryRepository>();
  const programs = createMock<ProgramRepository>();
  const skills = createMock<SkillRepository>();
  types.findById.mockResolvedValue(
    buildProjectType({
      templateFields: templateFields ?? [
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
      `Sensores IoT. Dudas a ${OMITTED_PERSONAL_DATA}`,
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

describe('AnalysisInputBuilder template fields (v2.1)', () => {
  const field = (key: string, kind: TemplateField['kind']): TemplateField => ({
    key,
    label: key,
    kind,
    required: false,
  });
  const valueOf = async (
    templateFields: TemplateField[],
    typeData: Record<string, unknown>,
    key: string,
  ) => {
    const { input } = await setup(templateFields).build(
      buildProject({ programId: null, typeData }),
    );
    return input.project.type.fields.find((f) => f.label === key)?.value;
  };

  it.each([
    [2_500_000, '$ 2.500.000 COP'],
    [3_000_000_000, '$ 3.000.000.000 COP'],
    [0, '$ 0 COP'],
  ])(
    'sends a currency value of %d as %s, not as an omitted phone number',
    async (amount, expected) => {
      await expect(
        valueOf([field('costo', 'currency')], { costo: amount }, 'costo'),
      ).resolves.toBe(expected);
    },
  );

  it('groups large plain numbers so they are not mistaken for a phone', async () => {
    await expect(
      valueOf([field('meta', 'number')], { meta: 1500000 }, 'meta'),
    ).resolves.toBe('1.500.000');
    await expect(
      valueOf([field('meses', 'number')], { meses: 12 }, 'meses'),
    ).resolves.toBe('12');
  });

  it('sends keywords as a comma separated list', async () => {
    await expect(
      valueOf(
        [field('palabras', 'tags')],
        { palabras: [' IoT ', 'agua', ''] },
        'palabras',
      ),
    ).resolves.toBe('IoT, agua');
  });

  it('omits a document number written in a template field', async () => {
    await expect(
      valueOf(
        [field('contacto', 'text')],
        { contacto: 'Responsable CC 1.094.123.456' },
        'contacto',
      ),
    ).resolves.toBe(`Responsable ${OMITTED_PERSONAL_DATA}`);
  });
});
