import { validateTemplateFields } from './template-fields';

describe('validateTemplateFields', () => {
  it('returns no errors for a valid template', () => {
    const errors = validateTemplateFields([
      { key: 'grupo', label: 'Grupo', kind: 'text', required: true },
      {
        key: 'nivel',
        label: 'Nivel',
        kind: 'select',
        required: true,
        options: ['Básico', 'Avanzado'],
      },
    ]);

    expect(errors).toEqual([]);
  });

  it('reports repeated keys', () => {
    const errors = validateTemplateFields([
      { key: 'a', label: 'A', kind: 'text', required: true },
      { key: 'a', label: 'A otra vez', kind: 'text', required: false },
    ]);

    expect(errors).toEqual(['La clave "a" está repetida']);
  });

  it('reports a select field without options', () => {
    const errors = validateTemplateFields([
      {
        key: 'nivel',
        label: 'Nivel',
        kind: 'select',
        required: true,
        options: [],
      },
    ]);

    expect(errors).toEqual([
      'El campo "Nivel" es de tipo lista y necesita al menos una opción',
    ]);
  });

  it('accepts keyword lists with limits and currency fields (v2.1)', () => {
    expect(
      validateTemplateFields([
        {
          key: 'palabras',
          label: 'Palabras clave',
          kind: 'tags',
          required: true,
          minItems: 3,
          maxItems: 5,
        },
        { key: 'costo', label: 'Costo', kind: 'currency', required: false },
      ]),
    ).toEqual([]);
  });

  it('reports inverted keyword limits and limits on other kinds', () => {
    expect(
      validateTemplateFields([
        {
          key: 'palabras',
          label: 'Palabras clave',
          kind: 'tags',
          required: true,
          minItems: 5,
          maxItems: 3,
        },
        {
          key: 'nota',
          label: 'Nota',
          kind: 'text',
          required: false,
          minItems: 2,
        },
      ]),
    ).toEqual([
      'En "Palabras clave" el mínimo de palabras clave no puede superar el máximo',
      '"Nota": mínimo y máximo de palabras clave solo aplican a una lista de palabras clave',
    ]);
  });
});
