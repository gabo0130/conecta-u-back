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

// RF15–RF17 y reconstrucción de embeddings por HTTP, con AI_PROVIDER=fake y la base de pruebas.

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

interface RecommendationsBody {
  generatedAt: string | null;
  profiles: {
    profileId: string;
    recommendations: { id: string; collaborator: { id: string } }[];
  }[];
}

const collaboratorIds = (body: RecommendationsBody) =>
  body.profiles.flatMap((profile) =>
    profile.recommendations.map((item) => item.collaborator.id),
  );

describe('Recomendaciones (integración)', () => {
  let app: INestApplication;
  let scenario: Scenario;
  let owner: string;
  let otherLeader: string;
  let admin: string;
  let collaborator: string;
  const http = () => request(app.getHttpServer());
  const url = () => `/api/projects/${scenario.projectId}/recommendations`;

  const list = async (query = '', token = owner) => {
    const response = await http()
      .get(`${url()}${query}`)
      .auth(token, { type: 'bearer' })
      .expect(200);
    return response.body as RecommendationsBody;
  };

  beforeAll(async () => {
    app = await createTestApp();
    await resetData(app);
    scenario = await seedScenario(app);
    [owner, otherLeader, admin, collaborator] = await Promise.all([
      login(app, EMAILS.owner),
      login(app, EMAILS.otherLeader),
      login(app, EMAILS.admin),
      login(app, EMAILS.collaborator),
    ]);
  });

  afterAll(() => app.close());

  it('409 al generar antes de analizar el proyecto', async () => {
    const response = await http()
      .post(url())
      .auth(owner, { type: 'bearer' })
      .expect(409);
    expect(response.body.message).toBe(
      'Primero analiza el proyecto con IA para obtener los perfiles requeridos.',
    );
  });

  describe('con el proyecto analizado', () => {
    beforeAll(async () => {
      await http()
        .post(`/api/projects/${scenario.projectId}/analysis`)
        .auth(owner, { type: 'bearer' })
        .expect(201);
    });

    it('GET antes de generar: todos los perfiles, listas vacías y generatedAt null', async () => {
      const body = await list();
      expect(body.generatedAt).toBeNull();
      expect(body.profiles).toHaveLength(2);
      expect(collaboratorIds(body)).toEqual([]);
    });

    it('403 al ADMIN al generar y a otro líder al consultar', async () => {
      await http().post(url()).auth(admin, { type: 'bearer' }).expect(403);
      await http().get(url()).auth(otherLeader, { type: 'bearer' }).expect(403);
    });

    it('200 genera solo con personas con consentimiento, disponibles y que no sean el líder', async () => {
      const response = await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .send({})
        .expect(200);
      const body = response.body as RecommendationsBody;

      expect(body.generatedAt).not.toBeNull();
      const ids = collaboratorIds(body);
      expect(ids).toContain(scenario.candidates.available);
      expect(ids).not.toContain(scenario.candidates.unavailable);
      expect(ids).not.toContain(scenario.candidates.noConsent);
      expect(ids).not.toContain(scenario.ownerCollaboratorId);
    });

    it('nunca expone datos de contacto de las personas', async () => {
      const response = await http()
        .get(url())
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(JSON.stringify(response.body)).not.toMatch(
        /@prueba\.test|"email"|"phone"|"profileUrl"|"document|9900000|3000000099|"nationality"|"alternateEmail"/,
      );
    });

    it('includeUnavailable: solo aparecen quienes entraron en una generación con ese flag', async () => {
      expect(
        collaboratorIds(await list('?includeUnavailable=true')),
      ).not.toContain(scenario.candidates.unavailable);

      await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .send({ includeUnavailable: true })
        .expect(200);

      expect(collaboratorIds(await list('?includeUnavailable=true'))).toContain(
        scenario.candidates.unavailable,
      );
      expect(collaboratorIds(await list())).not.toContain(
        scenario.candidates.unavailable,
      );
    });

    it('422 si includeUnavailable no es booleano', () =>
      http()
        .get(`${url()}?includeUnavailable=quizas`)
        .auth(owner, { type: 'bearer' })
        .expect(422));

    it('filtra por perfil y responde 404 con un perfil ajeno', async () => {
      const { profiles } = await list();
      const body = await list(`?profileId=${profiles[0].profileId}`);
      expect(body.profiles.map((profile) => profile.profileId)).toEqual([
        profiles[0].profileId,
      ]);

      const response = await http()
        .get(`${url()}?profileId=${UNKNOWN_ID}`)
        .auth(owner, { type: 'bearer' })
        .expect(404);
      expect(response.body.message).toBe('Perfil no encontrado');
    });

    it('RF17: el detalle explica el puntaje con pesos que suman 1 (dueño y ADMIN)', async () => {
      const body = await list();
      const [first] = body.profiles.flatMap(
        (profile) => profile.recommendations,
      );

      for (const token of [owner, admin]) {
        const response = await http()
          .get(`${url()}/${first.id}`)
          .auth(token, { type: 'bearer' })
          .expect(200);
        const { breakdown, score } = response.body as {
          score: number;
          breakdown: {
            weights: Record<string, number>;
            matchedSkills: { skill: string }[];
          };
        };
        const weightSum = Object.values(breakdown.weights).reduce(
          (sum, weight) => sum + weight,
          0,
        );
        expect(weightSum).toBeCloseTo(1, 5);
        expect(score).toBeGreaterThan(0);
        expect(breakdown.matchedSkills.length).toBeGreaterThan(0);
      }
    });

    it('Ley 1581: al retirar el consentimiento se borran su embedding y sus recomendaciones', async () => {
      const personId = scenario.candidates.available;
      const ds = app.get(DataSource);
      const stored = async () => {
        const [row]: { embedding: boolean; recommendations: string }[] =
          await ds.query(
            `SELECT "profileEmbedding" IS NOT NULL AS embedding,
               (SELECT count(*) FROM recommendations WHERE "collaboratorId" = $1) AS recommendations
             FROM collaborators WHERE id = $1`,
            [personId],
          );
        return row;
      };
      expect(await stored()).toEqual({
        embedding: true,
        recommendations: expect.not.stringMatching(/^0$/),
      });

      await http()
        .patch('/api/collaborators/me')
        .auth(collaborator, { type: 'bearer' })
        .send({ dataConsent: false })
        .expect(200);

      expect(await stored()).toEqual({
        embedding: false,
        recommendations: '0',
      });
      expect(
        collaboratorIds(await list('?includeUnavailable=true')),
      ).not.toContain(personId);
    });

    it('404 si la recomendación no existe', async () => {
      const response = await http()
        .get(`${url()}/${UNKNOWN_ID}`)
        .auth(owner, { type: 'bearer' })
        .expect(404);
      expect(response.body.message).toBe('Recomendación no encontrada');
    });

    it('409 si se descartan todos los perfiles', async () => {
      const { profiles } = await list();
      for (const profile of profiles) {
        await http()
          .patch(
            `/api/projects/${scenario.projectId}/required-profiles/${profile.profileId}`,
          )
          .auth(owner, { type: 'bearer' })
          .send({ active: false })
          .expect(200);
      }
      const response = await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .expect(409);
      expect(response.body.message).toBe(
        'El proyecto no tiene perfiles requeridos activos.',
      );
    });
  });

  describe('POST /admin/embeddings/rebuild', () => {
    const rebuildUrl = '/api/admin/embeddings/rebuild';

    it('403 a un LIDER', () =>
      http()
        .post(rebuildUrl)
        .auth(owner, { type: 'bearer' })
        .send({})
        .expect(403));

    it('422 con un límite fuera de rango', () =>
      http()
        .post(rebuildUrl)
        .auth(admin, { type: 'bearer' })
        .send({ limit: 0 })
        .expect(422));

    it('200 al ADMIN: con force recalcula a todas las personas con contenido', async () => {
      const response = await http()
        .post(rebuildUrl)
        .auth(admin, { type: 'bearer' })
        .send({ force: true })
        .expect(200);
      expect(response.body).toMatchObject({ failed: 0, remaining: 0 });
      expect(response.body.processed).toBeGreaterThan(0);
      expect(response.body.requiredProfiles).toMatchObject({
        failed: 0,
        remaining: 0,
      });
    });
  });
});
