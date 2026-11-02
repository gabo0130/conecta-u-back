import { maskEmail } from './invitation';

describe('maskEmail', () => {
  it('keeps the first two letters and the domain', () => {
    expect(maskEmail('ana.perez@ufps.edu.co')).toBe('an*******@ufps.edu.co');
    expect(maskEmail('a@x.co')).toBe('a***@x.co');
    expect(maskEmail('sin-arroba')).toBe('***');
  });
});
