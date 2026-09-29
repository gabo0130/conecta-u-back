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
});
