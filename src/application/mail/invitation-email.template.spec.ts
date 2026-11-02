import { renderInvitationEmail } from './invitation-email.template';

describe('renderInvitationEmail', () => {
  const base = {
    recipientFirstName: 'Ana',
    leaderName: 'Laura <Líder>',
    projectTitle: 'Huerta IoT',
    projectSummary: 'Sensores para riego. '.repeat(40),
    profileName: 'Backend',
    message: 'Hola Ana,\n<b>únete</b>',
    hasAccount: false,
    appUrl: 'https://conectau.test/',
  };

  it('escapes user text, keeps line breaks and shortens the summary', () => {
    const email = renderInvitationEmail(base);

    expect(email.subject).toContain('Huerta IoT');
    expect(email.html).toContain('Laura &lt;Líder&gt;');
    expect(email.html).toContain('Hola Ana,<br>&lt;b&gt;únete&lt;/b&gt;');
    expect(email.html).not.toContain('<b>únete</b>');
    expect(email.html).toContain('https://conectau.test/login');
    expect(email.text).toContain('como Backend');
    expect(email.text).toContain('crea tu cuenta');
    expect(email.text).toContain('…');
  });

  it('omits the role when there is no profile', () => {
    const email = renderInvitationEmail({
      ...base,
      profileName: null,
      hasAccount: true,
    });
    expect(email.text).not.toContain(' como ');
    expect(email.text).toContain('revisar tu perfil');
  });
});
