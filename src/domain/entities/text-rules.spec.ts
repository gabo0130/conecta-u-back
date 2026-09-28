import { maxLengthError, normalizeText, requiredTextError } from './text-rules';

describe('text rules', () => {
  it('normalizes by trimming both ends', () => {
    expect(normalizeText('  Ana María  ')).toBe('Ana María');
  });

  it.each([
    ['', {}, 'nombres es obligatorio'],
    ['ab', { min: 3 }, 'nombres debe tener al menos 3 caracteres'],
    ['a'.repeat(81), { max: 80 }, 'nombres admite máximo 80 caracteres'],
    ['Ana', { min: 2, max: 80 }, null],
  ])('requiredTextError(%p, %p) → %p', (value, length, expected) => {
    expect(requiredTextError('nombres', value, length)).toBe(expected);
  });

  it('only limits length when a maximum is given', () => {
    expect(maxLengthError('resumen', 'x'.repeat(5000), undefined)).toBeNull();
    expect(maxLengthError('grupo', 'x'.repeat(161), 160)).toBe(
      'grupo admite máximo 160 caracteres',
    );
  });
});
