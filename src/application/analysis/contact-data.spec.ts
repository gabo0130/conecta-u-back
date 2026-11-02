import {
  OMITTED_PERSONAL_DATA,
  redactContactData,
  stripContactData,
} from './contact-data';

describe('contact data redaction (Ley 1581)', () => {
  it.each([
    'ana.perez@correo.com',
    'https://linkedin.com/in/ana',
    'www.ana.dev',
    '+57 300 123 4567',
    '3001234567',
    '(607) 577 6655',
    '315-555-0100',
    '5776655',
    // v2.1: números de documento.
    'CC 1.094.123.456',
    'C.C. 88.123.456',
    'cédula: 88123456',
    'cédula de extranjería 123456789',
    'T.I. 1002003004',
    'pasaporte AB123456',
    'documento No. 1094123456',
    '1094123456',
  ])('quita %s', (contact) => {
    expect(stripContactData(`Escribir a ${contact} hoy`, '#')).toBe(
      'Escribir a # hoy',
    );
  });

  it.each([
    'Entre 2026-2027 se reduce el desperdicio en 30 %',
    'Presupuesto de 1.000.000 pesos',
    'Semestre 2026-1, grupo 12',
    'Norma ISO 27001',
    'Costo estimado: $ 2.500.000 COP',
    'Meta de $ 3.000.000.000 COP en regalías',
    'Capa de datos y documento de diseño',
  ])('no confunde años, montos ni códigos: "%s"', (text) => {
    expect(stripContactData(text, OMITTED_PERSONAL_DATA)).toBe(text);
  });

  it('para embeddings compacta los espacios que deja el texto quitado', () => {
    expect(
      redactContactData('Hola,\n escríbeme a a@b.co  o al 3001234567.'),
    ).toBe('Hola, escríbeme a o al .');
  });
});
