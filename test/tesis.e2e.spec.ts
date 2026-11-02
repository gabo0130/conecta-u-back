import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  EMAILS,
  resetData,
  type Scenario,
  seedScenario,
} from './support/fixtures';
import { createTestApp, login } from './support/test-app';
import { FakeNeedCharacterizer } from '../src/infrastructure/ai/fake-need-characterizer';
import { AnalyzerUnavailableError } from '../src/domain/repositories/project-analyzer.interface';
import { NEED_CHARACTERIZER } from '../src/shared/interfaces/tokens';

// Extensión de la tesis (PGCS01) por HTTP con la base de pruebas y la IA fake:
// necesidades (D1), caracterización, completitud, priorización y conversión en oportunidad.

const NEED = {
  title: 'Plataforma de citas de Bienestar',
  description:
    'La oficina de Bienestar necesita una plataforma web para que los estudiantes reserven citas de psicología, construida con Python y bases de datos.',
  kind: 'ADMINISTRATIVA',
  urgency: 4,
  impact: 5,
};

describe('Tesis (integración)', () => {
  let app: INestApplication;
  let scenario: Scenario;
  let admin: string;
  let owner: string;
  let otherLeader: string;
  let collaborator: string;
  // El caracterizador fake real, con la opción de simular una caída de la IA.
  const characterizer = new FakeNeedCharacterizer();
  let failCharacterizer = false;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder.overrideProvider(NEED_CHARACTERIZER).useValue({
        provider: characterizer.provider,
        model: characterizer.model,
        promptVersion: characterizer.promptVersion,
        isAvailable: () => true,
        characterize: (
          input: Parameters<typeof characterizer.characterize>[0],
        ) =>
          failCharacterizer
            ? Promise.reject(new AnalyzerUnavailableError('caída simulada'))
            : characterizer.characterize(input),
      }),
    );
    await resetData(app);
    scenario = await seedScenario(app);
    [admin, owner, otherLeader, collaborator] = await Promise.all([
      login(app, EMAILS.admin),
      login(app, EMAILS.owner),
      login(app, EMAILS.otherLeader),
      login(app, EMAILS.collaborator),
    ]);
  });

  afterAll(() => app.close());

  describe('T1 · necesidades', () => {
    let needId: string;

    it('el formulador registra una necesidad y la ve en su lista', async () => {
      const created = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, dependency: '  Bienestar Universitario ' })
        .expect(201);
      needId = created.body.id;
      expect(created.body).toMatchObject({
        status: 'REGISTRADA',
        dependency: 'Bienestar Universitario',
        createdById: scenario.ownerId,
        characterization: null,
        projectId: null,
      });

      const list = await http()
        .get('/api/needs')
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(list.body.needs.map((n: { id: string }) => n.id)).toEqual([
        needId,
      ]);
      expect(list.body.meta.total).toBe(1);
    });

    it('valida la escala de urgencia e impacto y el tipo', async () => {
      const scale = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, urgency: 6 })
        .expect(422);
      expect(scale.body.message).toMatch(/urgency .*entre 1 y 5/);
      const kind = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, kind: 'OTRA' })
        .expect(422);
      expect(kind.body.message).toMatch(/kind debe ser uno de/);
    });

    it('otro líder no la ve; el ADMIN sí; un colaborador no entra', async () => {
      await http()
        .get(`/api/needs/${needId}`)
        .auth(otherLeader, { type: 'bearer' })
        .expect(403);
      const otherList = await http()
        .get('/api/needs')
        .auth(otherLeader, { type: 'bearer' })
        .expect(200);
      expect(otherList.body.needs).toEqual([]);
      await http()
        .get(`/api/needs/${needId}`)
        .auth(admin, { type: 'bearer' })
        .expect(200);
      await http()
        .get('/api/needs')
        .auth(collaborator, { type: 'bearer' })
        .expect(403);
      await http()
        .post('/api/needs')
        .auth(admin, { type: 'bearer' })
        .send(NEED)
        .expect(403);
    });

    it('se edita mientras está abierta y, descartada, ya no (409)', async () => {
      const draft = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, title: 'Necesidad para descartar' })
        .expect(201);
      await http()
        .patch(`/api/needs/${draft.body.id}`)
        .auth(owner, { type: 'bearer' })
        .send({ urgency: 2, deadline: '2027-03-01' })
        .expect(200)
        .expect(({ body }) =>
          expect(body).toMatchObject({ urgency: 2, deadline: '2027-03-01' }),
        );
      await http()
        .post(`/api/needs/${draft.body.id}/discard`)
        .auth(owner, { type: 'bearer' })
        .send({ reason: 'Duplicada' })
        .expect(200)
        .expect(({ body }) =>
          expect(body).toMatchObject({
            status: 'DESCARTADA',
            discardReason: 'Duplicada',
          }),
        );
      await http()
        .patch(`/api/needs/${draft.body.id}`)
        .auth(owner, { type: 'bearer' })
        .send({ urgency: 3 })
        .expect(409);
      const filtered = await http()
        .get('/api/needs?status=DESCARTADA')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(filtered.body.needs).toHaveLength(1);
    });
  });

  describe('T2 · caracterización con IA', () => {
    let needId: string;

    beforeAll(async () => {
      // El catálogo de prueba tiene Python y Bases de datos: el texto de NEED los nombra.
      const created = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, title: 'Necesidad a caracterizar' })
        .expect(201);
      needId = created.body.id;
    });

    it('caracteriza, empareja el catálogo y pasa a CARACTERIZADA', async () => {
      const response = await http()
        .post(`/api/needs/${needId}/characterization`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(response.body.status).toBe('CARACTERIZADA');
      expect(response.body.characterizedAt).toEqual(expect.any(String));
      expect(response.body.characterization).toMatchObject({
        problem: expect.stringContaining('Bienestar necesita'),
        beneficiaries: 'Estudiantes',
        competencies: expect.arrayContaining([
          { skillId: scenario.skillIds.python, name: 'Python' },
          { skillId: scenario.skillIds.databases, name: 'Bases de datos' },
        ]),
        missingInformation: expect.arrayContaining(['Plazo esperado']),
        provider: 'fake',
        promptVersion: 'v1',
      });
      // La vuelve a ver igual al consultarla.
      const detail = await http()
        .get(`/api/needs/${needId}`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(detail.body.characterization.problem).toBe(
        response.body.characterization.problem,
      );
    });

    it('503 si la IA falla, y la caracterización anterior se conserva', async () => {
      failCharacterizer = true;
      try {
        const response = await http()
          .post(`/api/needs/${needId}/characterization`)
          .auth(owner, { type: 'bearer' })
          .expect(503);
        expect(response.body.message).toMatch(/no está disponible/);
      } finally {
        failCharacterizer = false;
      }
      const detail = await http()
        .get(`/api/needs/${needId}`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(detail.body.status).toBe('CARACTERIZADA');
    });

    it('solo la caracteriza su formulador', async () => {
      await http()
        .post(`/api/needs/${needId}/characterization`)
        .auth(otherLeader, { type: 'bearer' })
        .expect(403);
      await http()
        .post(`/api/needs/${needId}/characterization`)
        .auth(admin, { type: 'bearer' })
        .expect(403);
    });
  });
});
