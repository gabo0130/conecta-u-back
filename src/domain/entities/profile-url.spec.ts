import { PROFILE_URL_MAX_LENGTH } from './collaborator-limits';
import { isProfileUrl } from './profile-url';

describe('isProfileUrl', () => {
  it.each([
    'https://github.com/ana',
    'http://portafolio.ufps.edu.co/ana',
    'https://www.linkedin.com/in/ana-perez',
    'https://scienti.minciencias.gov.co/cvlac/visualizador?cod=123',
  ])('accepts %p', (url) => {
    expect(isProfileUrl(url)).toBe(true);
  });

  it.each([
    ['javascript:alert(1)', 'script en el enlace'],
    ['data:text/html,<script>alert(1)</script>', 'data URL'],
    ['ftp://files.ufps.edu.co', 'protocolo no web'],
    ['github.com/ana', 'sin protocolo'],
    ['http://localhost:3000', 'sin dominio'],
    ['https://', 'vacío'],
    ['no es un enlace', 'texto'],
  ])('rejects %p (%s)', (url) => {
    expect(isProfileUrl(url)).toBe(false);
  });

  it('rejects links longer than the column', () => {
    const base = 'https://github.com/';
    expect(
      isProfileUrl(base + 'a'.repeat(PROFILE_URL_MAX_LENGTH - base.length)),
    ).toBe(true);
    expect(
      isProfileUrl(base + 'a'.repeat(PROFILE_URL_MAX_LENGTH - base.length + 1)),
    ).toBe(false);
  });
});
