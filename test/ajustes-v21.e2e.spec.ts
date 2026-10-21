import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  EMAILS,
  resetData,
  type Scenario,
  seedScenario,
} from './support/fixtures';
import { createTestApp, login, TEST_PASSWORD } from './support/test-app';

// Ajustes v2.1 de la cliente (19/10/2026) por HTTP, con la base de pruebas.

interface ProfileBody {
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
  identificationComplete: boolean;
}

describe('Ajustes v2.1 (integración)', () => {
  let app: INestApplication;
  let scenario: Scenario;
  let admin: string;
  let owner: string;
  const http = () => request(app.getHttpServer());

  const person = (overrides: Record<string, unknown> = {}) => ({
    firstName: 'Camila',
    lastName: 'Rojas',
    personType: 'ESTUDIANTE',
    programId: scenario.programId,
    documentType: 'CC',
    documentNumber: '1.090.555.001',
    phone: '300 555 0001',
    nationality: 'Colombiana',
    ...overrides,
  });

  const register = (email: string, collaborator: Record<string, unknown>) =>
    http().post('/api/auth/register').send({
      fullName: 'Camila Rojas',
      email,
      password: TEST_PASSWORD,
      role: 'COLABORADOR',
      collaborator,
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

  describe('A1–A4: identificación en el registro', () => {
    it('201: registra con documento normalizado y la persona ve su identificación', async () => {
      await register('camila@prueba.test', person()).expect(201);
      const token = await login(app, 'camila@prueba.test');

      const response = await http()
        .get('/api/collaborators/me')
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(response.body as ProfileBody).toMatchObject({
        documentType: 'CC',
        documentNumber: '1090555001',
        phone: '3005550001',
        identificationComplete: true,
      });
    });

    it('409: el documento ya tiene otra cuenta (dos "Camila Rojas" se distinguen por cédula)', async () => {
      const response = await register(
        'otra.camila@prueba.test',
        person(),
      ).expect(409);
      expect(response.body.message).toBe(
        'El documento ya está registrado en otra cuenta',
      );
    });

    it('422: documento o teléfono con formato inválido', async () => {
      await register(
        'x1@prueba.test',
        person({ documentNumber: 'ABC', phone: '1' }),
      ).expect(422);
    });

    it('422: sin datos de la persona, también para un LIDER', async () => {
      await http()
        .post('/api/auth/register')
        .send({
          fullName: 'Líder sin datos',
          email: 'lider.sin.datos@prueba.test',
          password: TEST_PASSWORD,
          role: 'LIDER',
        })
        .expect(422);
    });
  });

  describe('ADMIN: personas', () => {
    it('crea un usuario ADMIN vinculado a una persona', async () => {
      await http()
        .post('/api/users')
        .auth(admin, { type: 'bearer' })
        .send({
          fullName: 'Judith Prueba',
          email: 'judith@prueba.test',
          password: TEST_PASSWORD,
          role: 'ADMIN',
          collaborator: person({
            firstName: 'Judith',
            personType: 'DOCENTE',
            documentNumber: '1090555002',
          }),
        })
        .expect(201);
    });

    it('lista las personas con su documento y sus habilidades por nombre (A7)', async () => {
      const response = await http()
        .get('/api/admin/collaborators?page=1&pageSize=50')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      const available = (
        response.body.collaborators as {
          id: string;
          documentNumber: string;
          skills: { name: string }[];
        }[]
      ).find((item) => item.id === scenario.candidates.available)!;

      expect(available.documentNumber).toMatch(/^99000000/);
      expect(available.skills.map((skill) => skill.name)).toEqual(
        expect.arrayContaining(['Python', 'Bases de datos']),
      );
    });

    it('corrige la identificación (solo el ADMIN cambia el documento) y evita duplicados', async () => {
      const url = `/api/admin/collaborators/${scenario.candidates.unavailable}`;
      const updated = await http()
        .patch(url)
        .auth(admin, { type: 'bearer' })
        .send({ documentType: 'PPT', documentNumber: 'ab12345' })
        .expect(200);
      expect(updated.body).toMatchObject({
        documentType: 'PPT',
        documentNumber: 'AB12345',
      });

      const conflict = await http()
        .patch(url)
        .auth(admin, { type: 'bearer' })
        .send({ documentType: 'CC', documentNumber: '1090555001' })
        .expect(409);
      expect(conflict.body.message).toBe(
        'El documento ya está registrado en otra persona',
      );

      await http()
        .patch(url)
        .auth(owner, { type: 'bearer' })
        .send({ phone: '3001112233' })
        .expect(403);
    });
  });

  describe('A5: el ADMIN registra proyectos a nombre de un líder', () => {
    const project = () => ({
      title: 'Proyecto registrado por el admin',
      summary: 'Resumen',
      objectives: 'Objetivos',
      typeId: scenario.typeId,
      categoryId: scenario.categoryId,
      deliverables: [{ name: 'Informe', scope: 'Final' }],
    });

    it('201 a nombre del líder; queda registrado quién lo creó', async () => {
      const response = await http()
        .post('/api/projects')
        .auth(admin, { type: 'bearer' })
        .send({ ...project(), leaderId: scenario.ownerId })
        .expect(201);

      expect(response.body).toMatchObject({
        leaderId: scenario.ownerId,
        status: 'BORRADOR',
      });
      expect(response.body.createdById).not.toBe(scenario.ownerId);

      // El proyecto es del líder: el ADMIN no lo edita.
      await http()
        .patch(`/api/projects/${response.body.id}`)
        .auth(admin, { type: 'bearer' })
        .send({ title: 'Cambio del admin' })
        .expect(403);
    });

    it('422 sin líder o con un usuario que no es líder', async () => {
      await http()
        .post('/api/projects')
        .auth(admin, { type: 'bearer' })
        .send(project())
        .expect(422);
      await http()
        .post('/api/projects')
        .auth(admin, { type: 'bearer' })
        .send({
          ...project(),
          leaderId: '00000000-0000-4000-8000-000000000000',
        })
        .expect(422);
    });
  });

  describe('A6: palabras clave y valor en pesos', () => {
    let typeId: string;

    beforeAll(async () => {
      const response = await http()
        .post('/api/admin/catalogs/project-types')
        .auth(admin, { type: 'bearer' })
        .send({
          code: 'CONVOCATORIA',
          name: 'Convocatoria',
          templateFields: [
            {
              key: 'palabrasClave',
              label: 'Palabras clave',
              kind: 'tags',
              required: true,
              minItems: 3,
              maxItems: 5,
            },
            {
              key: 'costo',
              label: 'Costo estimado',
              kind: 'currency',
              required: false,
            },
          ],
        })
        .expect(201);
      typeId = response.body.id;
    });

    const projectWith = (typeData: Record<string, unknown>) =>
      http()
        .post('/api/projects')
        .auth(owner, { type: 'bearer' })
        .send({
          title: 'Proyecto con palabras clave',
          summary: 'Resumen',
          objectives: 'Objetivos',
          typeId,
          categoryId: scenario.categoryId,
          deliverables: [{ name: 'Informe', scope: 'Final' }],
          typeData,
        });

    it('201 con 3 palabras clave y un costo en pesos', async () => {
      const response = await projectWith({
        palabrasClave: ['IoT', 'Agua', 'Sensores'],
        costo: 12000000,
      }).expect(201);
      expect(response.body.typeData.palabrasClave).toHaveLength(3);
    });

    it('400 con menos palabras clave de las que pide la plantilla', async () => {
      const response = await projectWith({ palabrasClave: ['IoT'] }).expect(
        400,
      );
      expect(response.body.message).toBe(
        'Palabras clave necesita entre 3 y 5 palabras clave',
      );
    });
  });
});
