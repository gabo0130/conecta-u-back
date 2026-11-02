import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  EMAILS,
  resetData,
  type Scenario,
  seedScenario,
} from './support/fixtures';
import { createTestApp, login, TEST_PASSWORD } from './support/test-app';

// Ajustes v2.2 de la docente (01/11/2026) por HTTP, con la base de pruebas.

interface ProfileBody {
  truthfulnessDeclared: boolean;
  truthfulnessDeclaredAt: string | null;
}

interface ErrorBody {
  message: string | string[];
}

const messagesOf = (body: ErrorBody) =>
  Array.isArray(body.message) ? body.message : [body.message];

describe('Ajustes v2.2 (integración)', () => {
  let app: INestApplication;
  let scenario: Scenario;
  let admin: string;
  let owner: string;
  const http = () => request(app.getHttpServer());

  const person = (documentNumber: string) => ({
    firstName: 'Valeria',
    lastName: 'Ortega',
    personType: 'ESTUDIANTE',
    programId: scenario.programId,
    documentType: 'CC',
    documentNumber,
    phone: '3005550101',
    nationality: 'Colombiana',
    dataConsent: true,
  });

  beforeAll(async () => {
    app = await createTestApp();
    await resetData(app);
    scenario = await seedScenario(app);
    [admin, owner] = await Promise.all([
      login(app, EMAILS.admin),
      login(app, EMAILS.owner),
    ]);
  });

  afterAll(() => app.close());

  describe('E2: declaración de veracidad', () => {
    const register = (email: string, collaborator: Record<string, unknown>) =>
      http().post('/api/auth/register').send({
        fullName: 'Valeria Ortega',
        email,
        password: TEST_PASSWORD,
        role: 'COLABORADOR',
        collaborator,
      });

    it('422: el registro sin la declaración no crea la cuenta', async () => {
      const response = await register('sin.declaracion@prueba.test', {
        ...person('7700000101'),
        truthfulnessDeclared: false,
      }).expect(422);

      expect(messagesOf(response.body as ErrorBody).join(' ')).toContain(
        'Debes declarar que la información es verídica.',
      );
      await http()
        .post('/api/auth/login')
        .send({ email: 'sin.declaracion@prueba.test', password: TEST_PASSWORD })
        .expect(401);
    });

    it('201: con la declaración queda guardada con su fecha y la persona la ve', async () => {
      await register('con.declaracion@prueba.test', {
        ...person('7700000102'),
        truthfulnessDeclared: true,
      }).expect(201);

      const token = await login(app, 'con.declaracion@prueba.test');
      const profile = await http()
        .get('/api/collaborators/me')
        .auth(token, { type: 'bearer' })
        .expect(200);
      const body = profile.body as ProfileBody;
      expect(body.truthfulnessDeclared).toBe(true);
      expect(body.truthfulnessDeclaredAt).not.toBeNull();

      // «Mi perfil» también la exige al guardar.
      await http()
        .patch('/api/collaborators/me')
        .auth(token, { type: 'bearer' })
        .send({ summary: 'Sin declarar' })
        .expect(422);
      await http()
        .patch('/api/collaborators/me')
        .auth(token, { type: 'bearer' })
        .send({ summary: 'Declarado', truthfulnessDeclared: true })
        .expect(200);
    });

    it('el ADMIN crea la cuenta sin declararla por la persona (queda pendiente)', async () => {
      const created = await http()
        .post('/api/users')
        .auth(admin, { type: 'bearer' })
        .send({
          fullName: 'Tomás Ruiz',
          email: 'tomas.admin@prueba.test',
          password: TEST_PASSWORD,
          role: 'COLABORADOR',
          collaborator: { ...person('7700000103'), firstName: 'Tomás' },
        })
        .expect(201);
      expect(created.body).toBeDefined();

      const token = await login(app, 'tomas.admin@prueba.test');
      const profile = await http()
        .get('/api/collaborators/me')
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect((profile.body as ProfileBody).truthfulnessDeclared).toBe(false);
    });
  });

  describe('E5: entidades y duración del proyecto', () => {
    const project = (overrides: Record<string, unknown> = {}) => ({
      title: 'Monitoreo del río Pamplonita',
      summary: 'Sensores de calidad del agua',
      objectives: 'Medir la calidad del agua',
      typeId: scenario.typeId,
      categoryId: scenario.categoryId,
      deliverables: [{ name: 'Prototipo', scope: 'Primer sensor' }],
      executingEntity: 'UFPS',
      durationMonths: 12,
      ...overrides,
    });
    const create = (body: Record<string, unknown>) =>
      http().post('/api/projects').auth(owner, { type: 'bearer' }).send(body);

    it('201: guarda ejecutora, patrocinadora y duración', async () => {
      const response = await create(
        project({ sponsorEntity: 'Gobernación de Norte de Santander' }),
      ).expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          executingEntity: 'UFPS',
          sponsorEntity: 'Gobernación de Norte de Santander',
          durationMonths: 12,
        }),
      );
    });

    it('201 sin patrocinadora (es opcional)', async () => {
      const response = await create(project()).expect(201);
      expect(
        (response.body as { sponsorEntity: unknown }).sponsorEntity,
      ).toBeNull();
    });

    it.each([
      ['sin ejecutora', { executingEntity: undefined }],
      ['sin duración', { durationMonths: undefined }],
      ['con 61 meses', { durationMonths: 61 }],
      ['con 0 meses', { durationMonths: 0 }],
    ])('422 %s', async (_case, overrides) => {
      await create(project(overrides)).expect(422);
    });
  });
});
