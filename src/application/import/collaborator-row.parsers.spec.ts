import {
  dateOf,
  emailOf,
  integerOf,
  labelOf,
  optionalTextOf,
  textOf,
} from './cell-parsers';
import {
  parseCollaboratorRow,
  parseExperienceRow,
  parseSkillRow,
} from './collaborator-row.parsers';
import type { CellValue } from '../../domain/repositories/collaborator-workbook.interface';

const collaborator = (overrides: Record<string, CellValue> = {}) => ({
  correo: ' ANA@Example.com ',
  nombres: 'Ana',
  apellidos: 'Pérez',
  tipo_persona: 'Estudiante',
  programa: '115',
  semestre: null,
  semillero_o_grupo: null,
  resumen: 'Backend',
  enlace: null,
  disponibilidad: 'No disponible',
  horas_semana: 0,
  autoriza_datos: 'SÍ',
  ...overrides,
});

const skill = (overrides: Record<string, CellValue> = {}) => ({
  correo: 'ana@example.com',
  habilidad: 'React',
  tipo: 'Habilidad blanda',
  categoria: null,
  nivel: 'Básico',
  meses_experiencia: 0,
  ultimo_uso: null,
  ...overrides,
});

const experience = (overrides: Record<string, CellValue> = {}) => ({
  correo: 'ana@example.com',
  tipo: 'Semillero de investigación',
  rol: 'Investigadora',
  organizacion: 'GIDIS',
  fecha_inicio: '2024-02-01',
  fecha_fin: '2024-12-01',
  actual: 'No',
  horas_semana: 8,
  nivel: 'Experto',
  tecnologias: ' Python ,, Pandas ',
  descripcion: null,
  ...overrides,
});

const reasonOf = (result: { ok: boolean; reason?: string }) =>
  result.ok ? null : result.reason;

describe('cell parsers', () => {
  it('normalizes cell values', () => {
    expect(textOf(null)).toBe('');
    expect(textOf(new Date('2024-03-15T00:00:00Z'))).toBe('2024-03-15');
    expect(optionalTextOf('  ')).toBeNull();
    expect(emailOf(' A@B.CO ')).toBe('a@b.co');
    expect(integerOf('12')).toBe(12);
    expect(integerOf(12.5)).toBeNull();
    expect(integerOf(null)).toBeNull();
    expect(dateOf('15/03/2024')).toBeNull();
    expect(dateOf('2024-13-40')).toBeNull();
    expect(dateOf('2024-02-30')).toBeNull();
    expect(dateOf('2024-02-29')).toBe('2024-02-29');
    expect(dateOf(new Date('2024-03-15T00:00:00Z'))).toBe('2024-03-15');
  });

  it('only resolves own label keys', () => {
    expect(labelOf({ si: 1 }, 'si')).toBe(1);
    expect(labelOf({ si: 1 }, 'toString')).toBeUndefined();
  });
});

describe('parseCollaboratorRow', () => {
  it('maps a valid row to domain values', () => {
    expect(parseCollaboratorRow(collaborator())).toEqual({
      ok: true,
      value: {
        email: 'ana@example.com',
        firstName: 'Ana',
        lastName: 'Pérez',
        personType: 'ESTUDIANTE',
        program: '115',
        semester: null,
        researchGroup: null,
        summary: 'Backend',
        profileUrl: null,
        availabilityStatus: 'NO_DISPONIBLE',
        weeklyHours: 0,
      },
    });
  });

  it.each([
    [{ correo: null }, 'Correo obligatorio'],
    [{ correo: 'ana-at-example' }, 'Correo inválido'],
    [{ apellidos: null }, 'Nombres y apellidos son obligatorios'],
    [
      { nombres: 'x'.repeat(81) },
      'Nombres y apellidos admiten máximo 80 caracteres',
    ],
    [{ tipo_persona: 'Egresado' }, 'tipo_persona inválido'],
    [{ programa: null }, 'Programa obligatorio'],
    [{ semestre: 40 }, 'semestre debe ser un entero entre 1 y 12'],
    [{ disponibilidad: 'A veces' }, 'disponibilidad inválida'],
    [{ horas_semana: 100 }, 'horas_semana debe ser un entero entre 0 y 60'],
    [{ horas_semana: null }, 'horas_semana debe ser un entero entre 0 y 60'],
    [{ autoriza_datos: 'No' }, 'Debe autorizar el tratamiento de datos'],
    [
      { semillero_o_grupo: 'g'.repeat(161) },
      'semillero_o_grupo admite máximo 160 caracteres',
    ],
  ])('rejects %p', (overrides, reason) => {
    expect(reasonOf(parseCollaboratorRow(collaborator(overrides)))).toBe(
      reason,
    );
  });
});

describe('parseSkillRow', () => {
  it('maps a valid row', () => {
    expect(parseSkillRow(skill({ ultimo_uso: 2025 }))).toEqual({
      ok: true,
      value: {
        name: 'React',
        type: 'HABILIDAD_BLANDA',
        category: undefined,
        level: 'BASICO',
        experienceMonths: 0,
        lastUsedYear: 2025,
      },
    });
  });

  it.each([
    [{ habilidad: null }, 'habilidad obligatoria'],
    [{ tipo: 'Otra' }, 'tipo de habilidad inválido'],
    [{ categoria: 'Cocina' }, 'categoria inválida'],
    [{ nivel: 'Maestro' }, 'nivel inválido'],
    [
      { meses_experiencia: 99999 },
      'meses_experiencia debe ser un entero entre 0 y 600',
    ],
    [
      { ultimo_uso: 3000 },
      'ultimo_uso debe ser un año entre 1970 y el año en curso',
    ],
    [
      { ultimo_uso: 'hace poco' },
      'ultimo_uso debe ser un año entre 1970 y el año en curso',
    ],
  ])('rejects %p', (overrides, reason) => {
    expect(reasonOf(parseSkillRow(skill(overrides)))).toBe(reason);
  });
});

describe('parseExperienceRow', () => {
  it('maps a valid row and splits technologies', () => {
    const result = parseExperienceRow(experience());

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        type: 'SEMILLERO_INVESTIGACION',
        startDate: '2024-02-01',
        endDate: '2024-12-01',
        current: false,
        level: 'EXPERTO',
        technologies: ['Python', 'Pandas'],
      }),
    });
  });

  it.each([
    [{ tipo: 'Hobby' }, 'tipo de experiencia inválido'],
    [{ rol: null }, 'rol y organización son obligatorios'],
    [
      { organizacion: 'o'.repeat(161) },
      'rol admite 120 caracteres y organización 160',
    ],
    [{ fecha_inicio: 'ayer' }, 'fecha_inicio inválida (formato AAAA-MM-DD)'],
    [
      { fecha_inicio: '2024-02-30' },
      'fecha_inicio inválida (formato AAAA-MM-DD)',
    ],
    [{ fecha_fin: '01/12/2024' }, 'fecha_fin inválida (formato AAAA-MM-DD)'],
    [{ actual: 'Sí' }, 'Una experiencia actual no debe tener fecha de fin'],
    [
      { fecha_fin: '2023-01-01' },
      'La fecha de fin no puede ser anterior a la fecha de inicio',
    ],
    [{ horas_semana: 0 }, 'horas_semana debe ser un entero entre 1 y 60'],
    [{ nivel: null }, 'nivel inválido'],
  ])('rejects %p', (overrides, reason) => {
    expect(reasonOf(parseExperienceRow(experience(overrides)))).toBe(reason);
  });
});
