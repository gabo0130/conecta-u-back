import {
  documentNumberError,
  isIdentificationComplete,
  isSameEmail,
  isValidInstitutionalCode,
  isValidPhone,
  normalizeDocumentNumber,
  normalizePhone,
} from './person-identification';

describe('person identification (v2.1, A1–A4)', () => {
  it('normalizes document numbers and phones the same way everywhere', () => {
    expect(normalizeDocumentNumber(' 1.090.123-456 ')).toBe('1090123456');
    expect(normalizeDocumentNumber('ab 12345')).toBe('AB12345');
    expect(normalizePhone('(+57) 300-123 4567')).toBe('+573001234567');
  });

  it.each([
    ['CC', '1090123456', null],
    ['TI', '1005123456', null],
    ['CE', '123456', null],
    ['PPT', '7654321A', null],
    ['PA', 'AB123456', null],
    ['CC', '', 'El número de documento es obligatorio'],
    [
      'CC',
      '1234',
      'El número de cédula de ciudadanía debe tener solo dígitos (entre 5 y 15)',
    ],
    [
      'CE',
      'X12345',
      'El número de cédula de extranjería debe tener solo dígitos (entre 5 y 15)',
    ],
    [
      'PA',
      'AB-1',
      'El número de pasaporte debe tener entre 5 y 20 letras o dígitos',
    ],
  ] as const)('%s %p → %p', (type, number, error) => {
    expect(documentNumberError(type, number)).toBe(error);
  });

  it('validates phones and institutional codes', () => {
    expect(isValidPhone('3001234567')).toBe(true);
    expect(isValidPhone('+573001234567')).toBe(true);
    expect(isValidPhone('5776655')).toBe(true);
    expect(isValidPhone('123456')).toBe(false);
    expect(isValidPhone('300 123 4567')).toBe(false);
    expect(isValidInstitutionalCode('1152034')).toBe(true);
    expect(isValidInstitutionalCode('con espacio')).toBe(false);
  });

  it('compares emails ignoring case and spaces', () => {
    expect(isSameEmail(' Ana@Example.com', 'ana@example.com')).toBe(true);
    expect(isSameEmail(null, 'ana@example.com')).toBe(false);
  });

  it('marks people before v2.1 as incomplete', () => {
    const complete = {
      documentType: 'CC' as const,
      documentNumber: '1090123456',
      phone: '3001234567',
      nationality: 'Colombiana',
    };
    expect(isIdentificationComplete(complete)).toBe(true);
    expect(isIdentificationComplete({ ...complete, phone: null })).toBe(false);
    expect(isIdentificationComplete({ ...complete, documentType: null })).toBe(
      false,
    );
  });
});
