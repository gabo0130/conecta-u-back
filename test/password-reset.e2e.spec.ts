import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import type { MailMessage } from '../src/domain/repositories/mail-sender.interface';
import { MAIL_SENDER } from '../src/shared/interfaces/tokens';
import { EMAILS, resetData, seedScenario } from './support/fixtures';
import { createTestApp, TEST_PASSWORD } from './support/test-app';

// Recuperación de contraseña por correo: enlace de un solo uso al correo principal y al alterno,
// sesiones anteriores revocadas y respuesta que no revela qué correos existen.

const NEW_PASSWORD = 'Recuperada2026';
const ALTERNATE = 'respaldo.colaborador@correo-ficticio.test';
const flush = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('Recuperación de contraseña (integración)', () => {
  let app: INestApplication;
  const sent: MailMessage[] = [];
  const http = () => request(app.getHttpServer());
  const tokenFrom = (mail: MailMessage) =>
    /#token=([A-Za-z0-9_-]{43})/.exec(mail.text)?.[1] ?? '';

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder.overrideProvider(MAIL_SENDER).useValue({
        send: (message: MailMessage) => {
          sent.push(message);
          return Promise.resolve();
        },
      }),
    );
    await resetData(app);
    await seedScenario(app);
    await app
      .get(DataSource)
      .query(
        `UPDATE collaborators SET "alternateEmail" = $1 WHERE "userId" = (SELECT id FROM users WHERE email = $2)`,
        [ALTERNATE, EMAILS.collaborator],
      );
  });

  afterAll(() => app.close());

  it('restablece con el enlace del correo, cierra las sesiones y no sirve dos veces', async () => {
    const login = await http()
      .post('/api/auth/login')
      .send({ email: EMAILS.collaborator, password: TEST_PASSWORD })
      .expect(200);
    const { access_token: oldAccess, refresh_token: oldRefresh } =
      login.body as { access_token: string; refresh_token: string };

    const unknown = await http()
      .post('/api/auth/password/forgot')
      .send({ email: 'nadie@correo-ficticio.test' })
      .expect(200);
    const known = await http()
      .post('/api/auth/password/forgot')
      .send({ email: EMAILS.collaborator.toUpperCase() })
      .expect(200);
    // Misma respuesta exista o no la cuenta.
    expect(known.body).toEqual(unknown.body);
    await flush();
    expect(sent.map((mail) => mail.to)).toEqual([
      EMAILS.collaborator,
      ALTERNATE,
    ]);
    const token = tokenFrom(sent[0]);
    expect(tokenFrom(sent[1])).toBe(token);

    // En la base solo está el hash.
    const [row]: { tokenHash: string }[] = await app
      .get(DataSource)
      .query(`SELECT "tokenHash" FROM password_reset_tokens`);
    expect(row.tokenHash).toHaveLength(64);
    expect(row.tokenHash).not.toContain(token);

    await expect(
      http().post('/api/auth/password/reset/check').send({ token }),
    ).resolves.toMatchObject({ status: 200, body: { valid: true } });
    await http()
      .post('/api/auth/password/reset/check')
      .send({ token: 'x'.repeat(43) })
      .expect(200, { valid: false });
    await http()
      .post('/api/auth/password/reset')
      .send({ token, password: 'solotexto' })
      .expect(422);

    // Se puede cambiar dos veces seguidas en el mismo segundo del login: se espera un segundo.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await http()
      .post('/api/auth/password/reset')
      .send({ token, password: NEW_PASSWORD })
      .expect(200);

    await http()
      .get('/api/auth/me')
      .auth(oldAccess, { type: 'bearer' })
      .expect(401);
    await http()
      .post('/api/auth/refresh')
      .send({ refresh_token: oldRefresh })
      .expect(401);
    await http()
      .post('/api/auth/login')
      .send({ email: EMAILS.collaborator, password: TEST_PASSWORD })
      .expect(401);
    const fresh = await http()
      .post('/api/auth/login')
      .send({ email: EMAILS.collaborator, password: NEW_PASSWORD })
      .expect(200);
    await http()
      .get('/api/auth/me')
      .auth((fresh.body as { access_token: string }).access_token, {
        type: 'bearer',
      })
      .expect(200);

    await http()
      .post('/api/auth/password/reset')
      .send({ token, password: 'OtraClave2026' })
      .expect(422);
    expect(sent.map((mail) => mail.subject)).toContain(
      'Tu contraseña de Conecta U cambió',
    );
  });

  it('limita las solicitudes por IP', async () => {
    // Ya se hicieron 2 solicitudes en la prueba anterior; el límite es 5 cada 15 minutos.
    for (let i = 0; i < 3; i += 1) {
      await http()
        .post('/api/auth/password/forgot')
        .send({ email: 'nadie@correo-ficticio.test' })
        .expect(200);
    }
    const blocked = await http()
      .post('/api/auth/password/forgot')
      .send({ email: 'nadie@correo-ficticio.test' })
      .expect(429);
    expect(blocked.body.message).toContain('demasiadas solicitudes');
  });
});
