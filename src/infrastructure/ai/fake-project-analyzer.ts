import type {
  AnalysisInput,
  AnalyzerResponse,
  ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';

type CatalogItem = AnalysisInput['catalog'][number];

const GENERIC_TECHNICAL = ['Desarrollo de software', 'Análisis de requisitos'];
const GENERIC_SOFT = ['Trabajo en equipo', 'Comunicación'];

/**
 * Analizador determinista, sin red: elige habilidades del catálogo que el texto del proyecto
 * menciona (o las primeras del catálogo) y arma dos perfiles. Sirve para desarrollo, pruebas
 * y como respaldo si la API de IA falla el día de la demostración (`AI_PROVIDER=fake`).
 */
export class FakeProjectAnalyzer implements ProjectAnalyzer {
  readonly provider = 'fake';
  readonly model = 'fake-1';
  readonly promptVersion = 'v1';

  isAvailable(): boolean {
    return true;
  }

  analyze(input: AnalysisInput): Promise<AnalyzerResponse> {
    const { project, catalog } = input;
    const text = normalizeSkillName(
      [
        project.title,
        project.summary,
        project.objectives,
        ...project.deliverables.flatMap((d) => [d.name, d.scope]),
        ...project.type.fields.map((field) => field.value),
      ].join(' '),
    );

    const technical = catalog.filter(
      (item) => item.type !== 'HABILIDAD_BLANDA',
    );
    const soft = catalog.filter((item) => item.type === 'HABILIDAD_BLANDA');

    const mentioned = technical.filter((item) =>
      text.includes(normalizeSkillName(item.name)),
    );
    const known = project.knownSkills
      .filter((skill) => skill.type !== 'HABILIDAD_BLANDA')
      .map((skill) => skill.name);
    const technicalNames = unique([
      ...mentioned.map((item) => item.name),
      ...known,
      ...technical.filter((item) => item.type === 'CONOCIMIENTO').map(nameOf),
      ...GENERIC_TECHNICAL,
    ]).slice(0, 4);
    const softNames = unique([...soft.map(nameOf), ...GENERIC_SOFT]).slice(
      0,
      3,
    );
    const managementNames = unique([
      ...technical.filter((item) => item.type === 'COMPETENCIA').map(nameOf),
      'Gestión de proyectos',
    ]).slice(0, 1);

    const objective = project.objectives.slice(0, 140).trim();
    return Promise.resolve({
      output: {
        resumen: `Análisis de prueba de "${project.title}": se identifican 2 perfiles a partir del resumen, los objetivos y los entregables.`,
        perfiles: [
          {
            nombre: 'Desarrollador del proyecto',
            descripcion: `Construye los entregables técnicos de ${project.title}.`,
            justificacion: `El proyecto tiene ${project.deliverables.length} entregable(s) que requieren construcción técnica para lograr: ${objective}`,
            cantidad: 2,
            prioridad: 'ALTA',
            horasSemanaSugeridas: 10,
            habilidades: [
              ...technicalNames.map((name, index) => ({
                nombre: name,
                tipo: 'CONOCIMIENTO',
                nivelMinimo: index < 2 ? 'INTERMEDIO' : 'BASICO',
                importancia: index < 2 ? 'ALTA' : 'MEDIA',
              })),
              {
                nombre: softNames[0],
                tipo: 'HABILIDAD_BLANDA',
                nivelMinimo: 'INTERMEDIO',
                importancia: 'MEDIA',
              },
            ],
          },
          {
            nombre: 'Coordinador del proyecto',
            descripcion: `Coordina al equipo y el avance de ${project.title}.`,
            justificacion: `Un proyecto de tipo ${project.type.name} necesita coordinación y comunicación constante para cumplir sus objetivos.`,
            cantidad: 1,
            prioridad: 'MEDIA',
            horasSemanaSugeridas: 6,
            habilidades: [
              ...managementNames.map((name) => ({
                nombre: name,
                tipo: 'COMPETENCIA',
                nivelMinimo: 'INTERMEDIO',
                importancia: 'ALTA',
              })),
              ...softNames.slice(0, 2).map((name) => ({
                nombre: name,
                tipo: 'HABILIDAD_BLANDA',
                nivelMinimo: 'AVANZADO',
                importancia: 'ALTA',
              })),
            ],
          },
        ],
      },
      usage: { inputTokens: null, outputTokens: null },
    });
  }
}

const nameOf = (item: CatalogItem): string => item.name;

function unique(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = normalizeSkillName(name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
