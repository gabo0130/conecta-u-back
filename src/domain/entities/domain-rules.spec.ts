import {
  COLLABORATOR_WEEKLY_HOURS,
  isIntegerInRange,
  isValidLastUsedYear,
} from './collaborator-limits';
import { isCalendarDate } from './calendar-date';
import { consentFields } from './data-consent';
import { experiencePeriodError } from './experience-period';
import { ProjectTypeEntity } from './project-type.entity';

describe('collaborator limits', () => {
  it.each([
    [0, true],
    [60, true],
    [61, false],
    [-1, false],
    [10.5, false],
  ])('weekly hours %p is valid: %p', (value, expected) => {
    expect(isIntegerInRange(value, COLLABORATOR_WEEKLY_HOURS)).toBe(expected);
  });

  it('accepts a last used year up to the current year only', () => {
    const now = new Date('2026-09-25T00:00:00Z');
    expect(isValidLastUsedYear(2026, now)).toBe(true);
    expect(isValidLastUsedYear(1970, now)).toBe(true);
    expect(isValidLastUsedYear(2027, now)).toBe(false);
    expect(isValidLastUsedYear(1969, now)).toBe(false);
  });
});

describe('isCalendarDate', () => {
  it.each([
    ['2024-02-29', true],
    ['2024-02-30', false],
    ['2023-02-29', false],
    ['2024-1-5', false],
    ['1', false],
  ])('%p is a calendar date: %p', (text, expected) => {
    expect(isCalendarDate(text)).toBe(expected);
  });
});

describe('consentFields', () => {
  it('records when consent was granted and clears it when revoked', () => {
    const now = new Date('2026-09-25T10:00:00Z');
    expect(consentFields(true, now)).toEqual({
      dataConsent: true,
      dataConsentAt: now,
    });
    expect(consentFields(false, now)).toEqual({
      dataConsent: false,
      dataConsentAt: null,
    });
  });
});

describe('experiencePeriodError', () => {
  it('accepts a finished or ongoing period', () => {
    expect(
      experiencePeriodError({
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        current: false,
      }),
    ).toBeNull();
    expect(
      experiencePeriodError({
        startDate: '2024-01-01',
        endDate: null,
        current: true,
      }),
    ).toBeNull();
  });

  it('rejects an ongoing experience with an end date', () => {
    expect(
      experiencePeriodError({
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        current: true,
      }),
    ).toBe('Una experiencia actual no debe tener fecha de fin');
  });

  it('rejects an end date before the start date', () => {
    expect(
      experiencePeriodError({
        startDate: '2024-06-01',
        endDate: '2024-01-01',
        current: false,
      }),
    ).toBe('La fecha de fin no puede ser anterior a la fecha de inicio');
  });
});

describe('ProjectTypeEntity.validateTypeData', () => {
  const type = new ProjectTypeEntity('t1', 'CURSO', 'Curso', [
    { key: 'asignatura', label: 'Asignatura', kind: 'text', required: true },
    { key: 'creditos', label: 'Créditos', kind: 'number', required: false },
    { key: 'inicio', label: 'Inicio', kind: 'date', required: false },
    {
      key: 'jornada',
      label: 'Jornada',
      kind: 'select',
      required: false,
      options: ['Diurna', 'Nocturna'],
    },
    { key: 'notas', label: 'Notas', kind: 'textarea', required: false },
  ]);

  it('accepts complete and well formed data', () => {
    expect(
      type.validateTypeData({
        asignatura: 'Seminario III',
        creditos: 3,
        inicio: '2026-08-17',
        jornada: 'Diurna',
        notas: 'x',
      }),
    ).toEqual([]);
  });

  it('reports unknown keys, missing required fields and wrong kinds', () => {
    expect(
      type.validateTypeData({
        extra: 1,
        creditos: '3',
        inicio: 'mañana',
        jornada: 'Sabatina',
        notas: 5,
      }),
    ).toEqual([
      'Campo desconocido: extra',
      'Falta el campo obligatorio: Asignatura',
      'Valor inválido para el campo: Créditos',
      'Valor inválido para el campo: Inicio',
      'Valor inválido para el campo: Jornada',
      'Valor inválido para el campo: Notas',
    ]);
  });

  it('treats an empty string as a missing value', () => {
    expect(type.validateTypeData({ asignatura: '' })).toEqual([
      'Falta el campo obligatorio: Asignatura',
    ]);
  });
});
