import {
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
} from './password-reset-email.template';

describe('password recovery emails', () => {
  it('sends the link with its validity and never a password', () => {
    const { subject, html, text } = renderPasswordResetEmail({
      fullName: 'Ana Pérez',
      resetUrl: 'https://conectau.test/restablecer-contrasena#token=abc',
      ttlMinutes: 30,
    });
    expect(subject).toBe('Restablece tu contraseña de Conecta U');
    for (const body of [html, text]) {
      expect(body).toContain('Hola, Ana');
      expect(body).toContain('vence en 30 minutos');
      expect(body).toContain('#token=abc');
      expect(body).not.toMatch(/Test1234|contraseña es/i);
    }
  });

  it('marks the copy sent to the alternate email', () => {
    const main = renderPasswordResetEmail({
      fullName: 'Ana',
      resetUrl: 'https://x/y',
      ttlMinutes: 30,
    });
    const alternate = renderPasswordResetEmail({
      fullName: 'Ana',
      resetUrl: 'https://x/y',
      ttlMinutes: 30,
      toAlternate: true,
    });
    expect(main.text).not.toContain('correo alterno');
    expect(alternate.text).toContain('correo alterno');
  });

  it('escapes the name and shows the change time in Colombia', () => {
    const { html, text } = renderPasswordChangedEmail({
      fullName: '<b>Ana</b>',
      changedAt: new Date('2026-11-02T20:30:00Z'),
      appUrl: 'https://conectau.test/',
    });
    expect(html).not.toContain('<b>Ana</b>');
    expect(text).toContain('3:30');
    expect(html).toContain('https://conectau.test/recuperar-contrasena');
  });
});
