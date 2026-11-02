import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
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

  describe('T3 · índice de completitud', () => {
    it('sube al registrar, caracterizar y completar lo que falta', async () => {
      const created = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, title: 'Necesidad para medir completitud' })
        .expect(201);
      expect(created.body.completeness).toBe(0);
      expect(created.body.missingElements).toHaveLength(7);

      const characterized = await http()
        .post(`/api/needs/${created.body.id}/characterization`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      // Problema, objetivo, beneficiarios, resultados y competencias: 20+20+15+15+15.
      expect(characterized.body.completeness).toBe(85);
      expect(
        characterized.body.missingElements.map(
          (item: { element: string }) => item.element,
        ),
      ).toEqual(['deadline', 'dependency']);

      const completed = await http()
        .patch(`/api/needs/${created.body.id}`)
        .auth(owner, { type: 'bearer' })
        .send({ deadline: '2027-06-30', dependency: 'Bienestar Universitario' })
        .expect(200);
      expect(completed.body.completeness).toBe(100);
      expect(completed.body.missingElements).toEqual([]);
    });
  });

  describe('T4 · priorización básica', () => {
    it('ordena la lista por prioridad y calcula el nivel', async () => {
      const leader = await login(app, EMAILS.otherLeader);
      const create = (title: string, urgency: number, impact: number) =>
        http()
          .post('/api/needs')
          .auth(leader, { type: 'bearer' })
          .send({ ...NEED, title, urgency, impact })
          .expect(201)
          .then((response) => response.body);
      const low = await create('Necesidad poco urgente', 1, 2);
      const high = await create('Necesidad muy urgente', 5, 5);
      const medium = await create('Necesidad intermedia', 3, 3);
      // 100 · (0,4·5/5 + 0,4·5/5 + 0) = 80
      expect(high).toMatchObject({ priorityScore: 80, priorityLevel: 'ALTA' });
      expect(medium).toMatchObject({
        priorityScore: 48,
        priorityLevel: 'MEDIA',
      });
      expect(low).toMatchObject({ priorityScore: 24, priorityLevel: 'BAJA' });

      const byPriority = await http()
        .get('/api/needs?sort=priority')
        .auth(leader, { type: 'bearer' })
        .expect(200);
      expect(byPriority.body.needs.map((n: { id: string }) => n.id)).toEqual([
        high.id,
        medium.id,
        low.id,
      ]);
      const recent = await http()
        .get('/api/needs')
        .auth(leader, { type: 'bearer' })
        .expect(200);
      expect(recent.body.needs[0].id).toBe(medium.id);
      await http()
        .get('/api/needs?sort=otro')
        .auth(leader, { type: 'bearer' })
        .expect(422);
    });

    it('caracterizar sube la prioridad por la completitud', async () => {
      const created = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, title: 'Necesidad para priorizar' })
        .expect(201);
      // 100 · (0,4·5/5 + 0,4·4/5 + 0) = 72
      expect(created.body.priorityScore).toBe(72);
      const characterized = await http()
        .post(`/api/needs/${created.body.id}/characterization`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      // + 0,2 · 85 = 17 → 89
      expect(characterized.body.priorityScore).toBe(89);
    });
  });

  describe('T5 · necesidad → oportunidad', () => {
    let needId: string;
    const projectBody = () => ({
      title: 'Plataforma de citas de Bienestar',
      summary: 'Los estudiantes no tienen dónde reservar citas de psicología.',
      objectives: 'Construir una plataforma web en Python con bases de datos.',
      executingEntity: 'Bienestar Universitario',
      durationMonths: 6,
      typeId: scenario.typeId,
      categoryId: scenario.categoryId,
      knownSkillIds: [scenario.skillIds.python],
      deliverables: [{ name: 'Prototipo', scope: 'Reservas en línea' }],
    });

    beforeAll(async () => {
      const created = await http()
        .post('/api/needs')
        .auth(owner, { type: 'bearer' })
        .send({ ...NEED, title: 'Necesidad para convertir' })
        .expect(201);
      needId = created.body.id;
      await http()
        .post(`/api/needs/${needId}/characterization`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
    });

    it('con datos inválidos no crea nada y la necesidad sigue abierta', async () => {
      await http()
        .post(`/api/needs/${needId}/opportunity`)
        .auth(owner, { type: 'bearer' })
        .send({ ...projectBody(), deliverables: [] })
        .expect(422);
      await http()
        .post(`/api/needs/${needId}/opportunity`)
        .auth(otherLeader, { type: 'bearer' })
        .send(projectBody())
        .expect(403);
      const detail = await http()
        .get(`/api/needs/${needId}`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(detail.body).toMatchObject({
        status: 'CARACTERIZADA',
        projectId: null,
      });
    });

    it('crea el proyecto, enlaza la necesidad y el proyecto se analiza y recomienda', async () => {
      const converted = await http()
        .post(`/api/needs/${needId}/opportunity`)
        .auth(owner, { type: 'bearer' })
        .send(projectBody())
        .expect(201);
      const projectId = converted.body.project.id;
      expect(converted.body.need).toMatchObject({
        status: 'CONVERTIDA',
        projectId,
      });
      expect(converted.body.project).toMatchObject({
        title: 'Plataforma de citas de Bienestar',
        leaderId: scenario.ownerId,
      });

      await http()
        .get(`/api/projects/${projectId}`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      await http()
        .post(`/api/projects/${projectId}/analysis`)
        .auth(owner, { type: 'bearer' })
        .expect(201);
      const recommendations = await http()
        .post(`/api/projects/${projectId}/recommendations`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(recommendations.body.profiles.length).toBeGreaterThan(0);

      // Ya convertida: no se convierte otra vez ni se edita.
      await http()
        .post(`/api/needs/${needId}/opportunity`)
        .auth(owner, { type: 'bearer' })
        .send(projectBody())
        .expect(409);
      await http()
        .post(`/api/needs/${needId}/characterization`)
        .auth(owner, { type: 'bearer' })
        .expect(409);
    });
  });

  describe('T6 · intereses en el perfil', () => {
    const embeddingUpdatedAt = async (): Promise<Date | null> => {
      const [row]: { embeddingUpdatedAt: Date | null }[] = await app
        .get(DataSource)
        .query(`SELECT "embeddingUpdatedAt" FROM collaborators WHERE id = $1`, [
          scenario.candidates.available,
        ]);
      return row.embeddingUpdatedAt;
    };
    const patchMe = (body: object) =>
      http()
        .patch('/api/collaborators/me')
        .auth(collaborator, { type: 'bearer' })
        .send({ truthfulnessDeclared: true, ...body });

    it('guarda los intereses normalizados y marca el embedding desactualizado', async () => {
      await http()
        .post('/api/admin/embeddings/rebuild')
        .auth(admin, { type: 'bearer' })
        .send({})
        .expect(200);
      expect(await embeddingUpdatedAt()).not.toBeNull();

      const saved = await patchMe({
        interests: [
          ' IA aplicada a la salud ',
          'ia aplicada a la salud',
          'IoT',
        ],
      }).expect(200);
      expect(saved.body.interests).toEqual(['IA aplicada a la salud', 'IoT']);
      expect(await embeddingUpdatedAt()).toBeNull();

      const profile = await http()
        .get('/api/collaborators/me')
        .auth(collaborator, { type: 'bearer' })
        .expect(200);
      expect(profile.body.interests).toEqual(['IA aplicada a la salud', 'IoT']);

      // Quitar uno también se guarda (la lista se reemplaza, no se mezcla).
      await patchMe({ interests: ['IoT'] })
        .expect(200)
        .expect(({ body }) => expect(body.interests).toEqual(['IoT']));
    });

    it('rechaza más de 10 intereses (422)', async () => {
      const response = await patchMe({
        interests: Array.from({ length: 11 }, (_, i) => `Tema ${i}`),
      }).expect(422);
      expect(response.body.message).toBe('Puedes registrar hasta 10 intereses');
    });
  });
});
