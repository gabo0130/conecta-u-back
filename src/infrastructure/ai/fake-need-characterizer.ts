import type { NeedKind } from '../../domain/entities/need';
import type { AnalyzerResponse } from '../../domain/repositories/project-analyzer.interface';
import type {
  CharacterizationInput,
  NeedCharacterizer,
} from '../../domain/repositories/need-characterizer.interface';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';

const BENEFICIARIES = [
  'estudiantes',
  'docentes',
  'investigadores',
  'egresados',
  'administrativos',
  'agricultores',
  'comunidad',
  'directores de programa',
];

const RESULTS: [RegExp, string][] = [
  [/plataforma|aplicacion|app |sistema|software/, 'Prototipo funcional'],
  [/tablero|dashboard|reporte/, 'Tablero de seguimiento'],
  [/campana|jornada|taller|capacitacion/, 'Jornadas o talleres realizados'],
  [/documentar|manual|guia/, 'Documentación entregada'],
  [/predecir|modelo|analisis de datos/, 'Modelo analítico validado'],
];

/** Tipo de proyecto que suele atender cada tipo de necesidad (si existe en el catálogo). */
const PROJECT_TYPE_BY_KIND: Record<NeedKind, string> = {
  ACADEMICA: 'CURSO',
  ADMINISTRATIVA: 'INTERDISCIPLINARIO',
  INVESTIGATIVA: 'INVESTIGACION',
  TECNOLOGICA: 'INTERDISCIPLINARIO',
  BIENESTAR: 'EXTENSION',
  INFRAESTRUCTURA: 'EXTENSION',
  INNOVACION: 'INVESTIGACION',
};

/**
 * Caracterizador determinista, sin red: empareja nombres del catálogo que aparecen en el
 * texto, detecta beneficiarios y resultados por palabras clave y declara lo que falta. Sirve
 * para desarrollo, pruebas y como respaldo en una demostración (`AI_PROVIDER=fake`).
 */
export class FakeNeedCharacterizer implements NeedCharacterizer {
  readonly provider = 'fake';
  readonly model = 'fake-1';
  readonly promptVersion = 'v1';

  isAvailable(): boolean {
    return true;
  }

  characterize({
    need,
    catalog,
    projectTypes,
  }: CharacterizationInput): Promise<AnalyzerResponse> {
    const text = ` ${normalizeSkillName(`${need.title} ${need.description}`)} `;
    const competencies = catalog
      .map((item) => item.name)
      .filter((name) => text.includes(` ${normalizeSkillName(name)} `));
    const beneficiaries = BENEFICIARIES.filter((word) =>
      text.includes(` ${word} `),
    );
    const results = RESULTS.filter(([pattern]) => pattern.test(text)).map(
      ([, result]) => result,
    );
    const codes = new Set(projectTypes.map((type) => type.code));
    const suggested = PROJECT_TYPE_BY_KIND[need.kind];

    const missing = [
      beneficiaries.length === 0 && 'Beneficiarios',
      results.length === 0 && 'Resultados esperados',
      competencies.length === 0 && 'Competencias requeridas',
      !need.hasDeadline && 'Plazo esperado',
      need.dependency === null && 'Dependencia que plantea la necesidad',
    ].filter((item): item is string => item !== false);

    return Promise.resolve({
      output: {
        problema: firstSentence(need.description),
        objetivo: `Dar respuesta a la necesidad: ${need.title}.`,
        beneficiarios: capitalize(beneficiaries.join(', ')),
        resultadosEsperados: results,
        competencias: competencies,
        tipoProyectoSugerido: codes.has(suggested) ? suggested : null,
        informacionFaltante: missing,
      },
      usage: { inputTokens: null, outputTokens: null },
    });
  }
}

function firstSentence(text: string): string {
  const [sentence] = text.split(/(?<=[.!?])\s/);
  return sentence.trim();
}

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : '';
}
