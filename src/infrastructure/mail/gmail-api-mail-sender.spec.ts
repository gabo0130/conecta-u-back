import { GmailApiMailSender } from './gmail-api-mail-sender';

const config = {
  clientId: 'client',
  clientSecret: 'secret',
  refreshToken: 'refresh',
  from: 'Conecta U <conectau.ufps@gmail.com>',
};
const message = {
  to: 'ana@ufps.edu.co',
  subject: 'Restablece tu contraseña de Conecta U',
  html: '<p>Hola</p>',
  text: 'Hola',
  replyTo: 'lider@ufps.edu.co',
};
const ok = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

describe('GmailApiMailSender', () => {
  it('gets an access token once and sends the MIME message in base64url', async () => {
    const fetchMock = jest.fn((url: string) =>
      url.includes('oauth2')
        ? ok({ access_token: 'access-1', expires_in: 3600 })
        : ok({ id: 'm1' }),
    );
    const sender = new GmailApiMailSender(
      config,
      fetchMock as unknown as typeof fetch,
    );

    await sender.send(message);
    await sender.send(message);

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      url.includes('oauth2'),
    );
    expect(tokenCalls).toHaveLength(1);
    const [url, init] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    );
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer access-1',
    );
    const raw = Buffer.from(
      (JSON.parse(init.body as string) as { raw: string }).raw,
      'base64url',
    ).toString();
    expect(raw).toContain('To: ana@ufps.edu.co');
    expect(raw).toContain('Reply-To: lider@ufps.edu.co');
    expect(raw).toContain('From: Conecta U <conectau.ufps@gmail.com>');
  });

  it('throws when Gmail rejects the token or the message', async () => {
    const denied = new GmailApiMailSender(
      config,
      jest.fn(() =>
        Promise.resolve({ ok: false, status: 401 }),
      ) as unknown as typeof fetch,
    );
    await expect(denied.send(message)).rejects.toThrow('token de Gmail (401)');

    const rejected = new GmailApiMailSender(
      config,
      jest.fn((url: string) =>
        url.includes('oauth2')
          ? ok({ access_token: 'a', expires_in: 3600 })
          : Promise.resolve({ ok: false, status: 400 }),
      ) as unknown as typeof fetch,
    );
    await expect(rejected.send(message)).rejects.toThrow('(400)');
  });
});
