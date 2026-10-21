import { escapeHtml, renderWelcomeEmail } from './welcome-email.template';

describe('renderWelcomeEmail', () => {
  const base = {
    fullName: 'Ana María Pérez',
    appUrl: 'https://conectau.test/',
  };

  it('greets the user by first name and names the role', () => {
    const { html, text, subject } = renderWelcomeEmail({
      ...base,
      role: 'LIDER',
    });

    expect(subject).toContain('Conecta U');
    expect(html).toContain('¡Hola, Ana! Te damos la bienvenida');
    expect(html).toContain('Líder de proyecto');
    expect(text).toContain('Entras como Líder de proyecto');
  });

  it.each([
    ['LIDER', 'Registrar mi primer proyecto'],
    ['COLABORADOR', 'Completar mi perfil'],
    ['ADMIN', 'Ir al panel'],
  ] as const)('uses role specific content for %s', (role, cta) => {
    const { html, text } = renderWelcomeEmail({ ...base, role });

    expect(html).toContain(cta);
    expect(text).toContain(cta);
  });

  it('builds the link from the app url without a double slash', () => {
    const { html } = renderWelcomeEmail({ ...base, role: 'COLABORADOR' });

    expect(html).toContain('href="https://conectau.test/login"');
  });

  it('escapes the name so it cannot inject html', () => {
    const { html } = renderWelcomeEmail({
      fullName: '<img src=x onerror=alert(1)>',
      role: 'COLABORADOR',
      appUrl: 'https://conectau.test',
    });

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  it('never includes a password', () => {
    const { html, text } = renderWelcomeEmail({ ...base, role: 'ADMIN' });

    expect(`${html}${text}`.toLowerCase()).not.toContain('contraseña:');
  });
});

describe('escapeHtml', () => {
  it('escapes the characters that matter in html', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});
