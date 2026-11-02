import { interestsError, normalizeInterests } from './collaborator-limits';

describe('intereses del perfil (tesis, T6)', () => {
  it('normaliza: recorta, compacta espacios y quita vacíos y repetidos', () => {
    expect(
      normalizeInterests([
        '  IA   aplicada ',
        'ia aplicada',
        'IA APLICADA',
        '',
        'Energía',
        'energia',
      ]),
    ).toEqual(['IA aplicada', 'Energía']);
  });

  it('valida cantidad y longitud', () => {
    expect(interestsError([])).toBeNull();
    expect(interestsError(['Robótica'])).toBeNull();
    expect(interestsError(['x'])).toMatch(/entre 2 y 60/);
    expect(interestsError(['x'.repeat(61)])).toMatch(/entre 2 y 60/);
    expect(
      interestsError(Array.from({ length: 11 }, (_, i) => `Tema ${i}`)),
    ).toBe('Puedes registrar hasta 10 intereses');
  });
});
