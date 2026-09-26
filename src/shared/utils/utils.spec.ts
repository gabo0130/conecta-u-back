import { computeDurationMonths } from './compute-duration-months';
import { normalizeSkillName } from './normalize-skill-name';

describe('normalizeSkillName', () => {
  it.each([
    ['  React.JS ', 'reactjs'],
    ['Programación', 'programacion'],
    ['Machine   Learning', 'machine learning'],
    ['C#', 'c#'],
    ['C++', 'c++'],
    ['100%_seguro', '100seguro'],
  ])('%p -> %p', (input, expected) => {
    expect(normalizeSkillName(input)).toBe(expected);
  });

  it('keeps C, C# and C++ as different skills', () => {
    const names = ['C', 'C#', 'C++'].map(normalizeSkillName);
    expect(new Set(names).size).toBe(3);
  });
});

describe('computeDurationMonths', () => {
  it('counts whole months between two dates in UTC', () => {
    expect(computeDurationMonths('2024-01-01', '2024-07-01')).toBe(6);
    expect(computeDurationMonths('2023-11-01', '2024-02-01')).toBe(3);
  });

  it('counts until today when the experience is ongoing', () => {
    expect(
      computeDurationMonths(
        '2026-01-01',
        null,
        new Date('2026-09-25T02:00:00Z'),
      ),
    ).toBe(8);
  });

  it('does not count a month that is not complete', () => {
    expect(computeDurationMonths('2024-01-31', '2024-02-01')).toBe(0);
    expect(computeDurationMonths('2024-01-15', '2024-03-14')).toBe(1);
  });

  it('never returns a negative duration', () => {
    expect(computeDurationMonths('2024-07-01', '2024-01-01')).toBe(0);
  });
});
