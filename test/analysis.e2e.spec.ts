import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { MAX_ANALYSES_PER_DAY } from '../src/domain/entities/analysis-limits';
import {
  AnalyzerUnavailableError,
  type ProjectAnalyzer,
} from '../src/domain/repositories/project-analyzer.interface';
import { PROJECT_ANALYZER } from '../src/shared/interfaces/tokens';
import {
  EMAILS,
  resetData,
  type Scenario,
  seedScenario,
} from './support/fixtures';
import { createTestApp, login } from './support/test-app';

// RF12–RF14 por HTTP, con la app completa, la base de pruebas y AI_PROVIDER=fake.

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

interface AnalysisBody {
  id: string;
  status: string;
  provider: string;
  profiles: { id: string; source: string; skills: { catalogued: boolean }[] }[];
}

const projectStatus = async (app: INestApplication, id: string) => {
  const [row]: { status: string }[] = await app
    .get(DataSource)
    .query('SELECT status FROM projects WHERE id = $1', [id]);
  return row.status;
};

describe('Análisis con IA (integración)', () => {
  let app: INestApplication;
  let scenario: Scenario;
  let owner: string;
  let otherLeader: string;
  let admin: string;
  let collaborator: string;
  const http = () => request(app.getHttpServer());
  const analysisUrl = () => `/api/projects/${scenario.projectId}/analysis`;

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

  describe('POST /projects/:id/analysis — permisos y validación', () => {
    it('401 sin token', () => http().post(analysisUrl()).expect(401));

    it('403 si no es LIDER', () =>
      http()
        .post(analysisUrl())
        .auth(collaborator, { type: 'bearer' })
        .expect(403));

    it('403 si es LIDER pero no es el dueño', () =>
      http()
        .post(analysisUrl())
        .auth(otherLeader, { type: 'bearer' })
        .expect(403));

    it('403 al ADMIN: puede ver el análisis pero no pedirlo', () =>
      http().post(analysisUrl()).auth(admin, { type: 'bearer' }).expect(403));

    it('404 si el proyecto no existe', () =>
      http()
        .post(`/api/projects/${UNKNOWN_ID}/analysis`)
        .auth(owner, { type: 'bearer' })
        .expect(404));

    it('422 si al proyecto le faltan los objetivos', async () => {
      const response = await http()
        .post(`/api/projects/${scenario.incompleteProjectId}/analysis`)
        .auth(owner, { type: 'bearer' })
        .expect(422);
      expect(response.body).toEqual({
        statusCode: 422,
        message:
          'El proyecto necesita título, resumen y objetivos para poder analizarse.',
      });
    });

    it('404 en GET mientras no haya ningún análisis', async () => {
      const response = await http()
        .get(analysisUrl())
        .auth(owner, { type: 'bearer' })
        .expect(404);
      expect(response.body.message).toBe(
        'Este proyecto aún no tiene un análisis.',
      );
    });

    it('409 si ya hay un análisis en curso', async () => {
      const ds = app.get(DataSource);
      const [pending]: { id: string }[] = await ds.query(
        `INSERT INTO project_analyses ("projectId", status, provider, model, "promptVersion", input)
         VALUES ($1, 'PENDIENTE', 'fake', 'fake-1', 'v1', '{}') RETURNING id`,
        [scenario.projectId],
      );
      try {
        const response = await http()
          .post(analysisUrl())
          .auth(owner, { type: 'bearer' })
          .expect(409);
        expect(response.body.message).toBe(
          'Ya hay un análisis en curso para este proyecto.',
        );
      } finally {
        // Cuenta para el límite diario: se borra para no afectar las pruebas siguientes.
        await ds.query('DELETE FROM project_analyses WHERE id = $1', [
          pending.id,
        ]);
      }
    });
  });

  describe('flujo completo con el proveedor fake', () => {
    let analysis: AnalysisBody;

    it('201: analiza, propone perfiles del catálogo y deja el proyecto ANALIZADO', async () => {
      const response = await http()
        .post(analysisUrl())
        .auth(owner, { type: 'bearer' })
        .expect(201);
      analysis = response.body as AnalysisBody;

      expect(analysis).toMatchObject({
        status: 'COMPLETADO',
        provider: 'fake',
        outdated: false,
      });
      expect(analysis.profiles).toHaveLength(2);
      expect(
        analysis.profiles.every((profile) => profile.source === 'IA'),
      ).toBe(true);
      expect(
        analysis.profiles[0].skills.some((skill) => skill.catalogued),
      ).toBe(true);
      expect(await projectStatus(app, scenario.projectId)).toBe('ANALIZADO');
    });

    it('GET devuelve el último análisis al dueño y al ADMIN, no a otro líder', async () => {
      for (const token of [owner, admin]) {
        const response = await http()
          .get(analysisUrl())
          .auth(token, { type: 'bearer' })
          .expect(200);
        expect(response.body.id).toBe(analysis.id);
      }
      await http()
        .get(analysisUrl())
        .auth(otherLeader, { type: 'bearer' })
        .expect(403);
    });

    it('GET /analyses lista el historial paginado', async () => {
      const response = await http()
        .get(`/api/projects/${scenario.projectId}/analyses?page=1&pageSize=20`)
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(response.body.meta).toMatchObject({ page: 1, total: 1 });
      expect(response.body.analyses[0]).not.toHaveProperty('profiles');
    });
  });

  describe('perfiles requeridos manuales (RF13)', () => {
    const profilesUrl = () =>
      `/api/projects/${scenario.projectId}/required-profiles`;
    const validProfile = () => ({
      name: 'Diseñador de interfaces',
      quantity: 1,
      priority: 'MEDIA',
      skills: [
        {
          skillId: scenario.skillIds.python,
          minLevel: 'INTERMEDIO',
          importance: 'ALTA',
        },
      ],
    });
    let manualId: string;

    it('201 crea un perfil MANUAL al final de la lista', async () => {
      const response = await http()
        .post(profilesUrl())
        .auth(owner, { type: 'bearer' })
        .send(validProfile())
        .expect(201);
      manualId = response.body.id;
      expect(response.body).toMatchObject({
        source: 'MANUAL',
        name: 'Diseñador de interfaces',
        active: true,
      });
    });

    it('422 con habilidades repetidas', async () => {
      const skill = validProfile().skills[0];
      const response = await http()
        .post(profilesUrl())
        .auth(owner, { type: 'bearer' })
        .send({ ...validProfile(), skills: [skill, skill] })
        .expect(422);
      expect(response.body.message).toBe(
        'Hay habilidades repetidas en el perfil.',
      );
    });

    it('422 si el cuerpo no cumple el contrato (cantidad fuera de rango)', async () => {
      const response = await http()
        .post(profilesUrl())
        .auth(owner, { type: 'bearer' })
        .send({ ...validProfile(), quantity: 0 })
        .expect(422);
      expect(typeof response.body.message).toBe('string');
    });

    it('404 si la habilidad no existe en el catálogo', async () => {
      const response = await http()
        .post(profilesUrl())
        .auth(owner, { type: 'bearer' })
        .send({
          ...validProfile(),
          skills: [
            { skillId: UNKNOWN_ID, minLevel: 'BASICO', importance: 'BAJA' },
          ],
        })
        .expect(404);
      expect(response.body.message).toBe('Habilidad no encontrada');
    });

    it('403 si otro líder intenta agregar un perfil', () =>
      http()
        .post(profilesUrl())
        .auth(otherLeader, { type: 'bearer' })
        .send(validProfile())
        .expect(403));

    it('PATCH active:false descarta el perfil y deja de aparecer en el análisis', async () => {
      await http()
        .patch(`${profilesUrl()}/${manualId}`)
        .auth(owner, { type: 'bearer' })
        .send({ active: false })
        .expect(200);
      const response = await http()
        .get(analysisUrl())
        .auth(owner, { type: 'bearer' })
        .expect(200);
      const ids = (response.body as AnalysisBody).profiles.map(
        (profile) => profile.id,
      );
      expect(ids).not.toContain(manualId);
    });

    it('404 al editar un perfil que no existe', () =>
      http()
        .patch(`${profilesUrl()}/${UNKNOWN_ID}`)
        .auth(owner, { type: 'bearer' })
        .send({ name: 'Otro' })
        .expect(404));
  });

  it(`409 al superar ${MAX_ANALYSES_PER_DAY} análisis por día`, async () => {
    // Ya hay 1 completado: se completan los que faltan hasta el máximo y el siguiente se rechaza.
    for (let attempt = 2; attempt <= MAX_ANALYSES_PER_DAY; attempt++) {
      await http()
        .post(analysisUrl())
        .auth(owner, { type: 'bearer' })
        .expect(201);
    }
    const response = await http()
      .post(analysisUrl())
      .auth(owner, { type: 'bearer' })
      .expect(409);
    expect(response.body.message).toBe(
      `Alcanzaste el máximo de ${MAX_ANALYSES_PER_DAY} análisis por día para este proyecto. Intenta de nuevo mañana.`,
    );
  });
});

describe('Análisis con IA caída (integración, 503)', () => {
  let app: INestApplication;
  let scenario: Scenario;
  let owner: string;
  // Analizador que falla a voluntad: caída del servicio o cuota diaria agotada.
  const analyzer: ProjectAnalyzer & { available: boolean } = {
    provider: 'fake',
    model: 'fake-1',
    promptVersion: 'v1',
    available: true,
    isAvailable() {
      return this.available;
    },
    analyze: () =>
      Promise.reject(
        new AnalyzerUnavailableError('caída simulada con detalle técnico'),
      ),
  };
  const history = async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/projects/${scenario.projectId}/analyses`)
      .auth(owner, { type: 'bearer' })
      .expect(200);
    return response.body.analyses as {
      status: string;
      errorMessage: string | null;
    }[];
  };

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder.overrideProvider(PROJECT_ANALYZER).useValue(analyzer),
    );
    await resetData(app);
    scenario = await seedScenario(app);
    owner = await login(app, EMAILS.owner);
  });

  afterAll(() => app.close());

  it('503 si la IA falla: mensaje propio, intento en ERROR y el proyecto vuelve a BORRADOR', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/projects/${scenario.projectId}/analysis`)
      .auth(owner, { type: 'bearer' })
      .expect(503);

    expect(response.body).toEqual({
      statusCode: 503,
      message:
        'El servicio de análisis no está disponible. Intenta de nuevo en unos minutos.',
    });
    expect(await projectStatus(app, scenario.projectId)).toBe('BORRADOR');
    const attempts = await history();
    expect(attempts).toHaveLength(1);
    expect(attempts[0].status).toBe('ERROR');
    // El detalle técnico se queda en el log, no en la base ni en la respuesta.
    expect(attempts[0].errorMessage).not.toContain('detalle técnico');
  });

  it('503 si la cuota diaria está agotada, sin crear un intento nuevo', async () => {
    analyzer.available = false;
    const response = await request(app.getHttpServer())
      .post(`/api/projects/${scenario.projectId}/analysis`)
      .auth(owner, { type: 'bearer' })
      .expect(503);

    expect(response.body.message).toBe(
      'El servicio de análisis alcanzó su límite de uso por hoy. Intenta de nuevo más tarde.',
    );
    expect(await history()).toHaveLength(1);
  });
});
