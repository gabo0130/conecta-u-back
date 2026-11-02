import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Workbook } from 'exceljs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import type { MailMessage } from '../src/domain/repositories/mail-sender.interface';
import { MAIL_SENDER } from '../src/shared/interfaces/tokens';
import {
  EMAILS,
  resetData,
  type Scenario,
  seedScenario,
} from './support/fixtures';
import { createTestApp, login } from './support/test-app';
import { TEST_STORAGE_DIR } from './support/test-env';

// Iteración 3 (Examen) por HTTP con la base de pruebas: RF4 (certificados, v2.2 E8),
// RF15–RF16 (estadísticas y reportes), RF17 (personas) y RF21–RF22 (convocatorias).

const PDF = Buffer.from('%PDF-1.7\n% certificado de prueba\n');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);

describe('Iteración 3 (integración)', () => {
  let app: INestApplication;
  let scenario: Scenario;
  let admin: string;
  let owner: string;
  let otherLeader: string;
  let collaborator: string;
  const sent: MailMessage[] = [];
  let failNextMail = false;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder.overrideProvider(MAIL_SENDER).useValue({
        send: (message: MailMessage) => {
          if (failNextMail) {
            failNextMail = false;
            return Promise.reject(new Error('550 rejected'));
          }
          sent.push(message);
          return Promise.resolve();
        },
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

  describe('RF4 · certificado de la experiencia', () => {
    let experienceId: string;
    const work = {
      type: 'LABORAL',
      role: 'Desarrollador',
      organization: 'Empresa de prueba',
      startDate: '2024-01-01',
      endDate: '2024-12-01',
      current: false,
      weeklyHours: 20,
      level: 'INTERMEDIO',
    };
    const experienceCount = async () =>
      (
        await http()
          .get('/api/collaborators/me')
          .auth(collaborator, { type: 'bearer' })
          .expect(200)
      ).body.experiences.length as number;

    beforeAll(async () => {
      const before = await experienceCount();
      // Sin certificado o con un archivo falso no se guarda nada (bloqueo por validación).
      await http()
        .post('/api/collaborators/me/experience')
        .auth(collaborator, { type: 'bearer' })
        .send(work)
        .expect(400);
      await http()
        .post('/api/collaborators/me/experience')
        .auth(collaborator, { type: 'bearer' })
        .field('data', JSON.stringify(work))
        .attach('file', Buffer.from('texto renombrado'), 'falso.pdf')
        .expect(422);
      expect(await experienceCount()).toBe(before);

      const response = await http()
        .post('/api/collaborators/me/experience')
        .auth(collaborator, { type: 'bearer' })
        .field('data', JSON.stringify(work))
        .attach('file', PDF, {
          filename: 'Certificado.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);
      experienceId = response.body.id;
      expect(response.body).toMatchObject({
        certificate: {
          fileName: 'Certificado.pdf',
          mimeType: 'application/pdf',
        },
        certificateRequired: true,
      });
    });

    it('guarda el archivo en el almacenamiento y en la base solo sus metadatos', async () => {
      const [row]: { storageKey: string; content: Buffer | null }[] = await app
        .get(DataSource)
        .query(
          `SELECT "storageKey", content FROM experience_certificates WHERE "experienceId" = $1`,
          [experienceId],
        );
      expect(row.content).toBeNull();
      expect(row.storageKey).toMatch(/^certificates\//);
      const stored = await readFile(join(TEST_STORAGE_DIR, row.storageKey));
      expect(Buffer.compare(stored, PDF)).toBe(0);
    });

    it('rechaza un JSON mal formado en el campo data', async () => {
      await http()
        .post('/api/collaborators/me/experience')
        .auth(collaborator, { type: 'bearer' })
        .field('data', '{no es json')
        .attach('file', PDF, 'c.pdf')
        .expect(400);
    });

    const certificateUrl = () =>
      `/api/collaborators/me/experience/${experienceId}/certificate`;

    it('sube un PDF, lo muestra en el perfil y solo el dueño o el ADMIN lo descargan', async () => {
      const upload = await http()
        .put(certificateUrl())
        .auth(collaborator, { type: 'bearer' })
        .attach('file', PDF, {
          filename: 'Certificado.pdf',
          contentType: 'application/pdf',
        })
        .expect(200);
      expect(upload.body.certificate).toMatchObject({
        fileName: 'Certificado.pdf',
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
      });

      const profile = await http()
        .get('/api/collaborators/me')
        .auth(collaborator, { type: 'bearer' })
        .expect(200);
      expect(profile.body.experiences[0].certificate.fileName).toBe(
        'Certificado.pdf',
      );

      const download = await http()
        .get(certificateUrl())
        .auth(collaborator, { type: 'bearer' })
        .buffer(true)
        .parse((res, done) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => done(null, Buffer.concat(chunks)));
        })
        .expect(200);
      expect(download.headers['content-type']).toBe('application/pdf');
      expect(download.headers['x-content-type-options']).toBe('nosniff');
      expect(Buffer.compare(download.body as Buffer, PDF)).toBe(0);

      await http()
        .get(
          `/api/admin/collaborators/${scenario.candidates.available}/experience/${experienceId}/certificate`,
        )
        .auth(admin, { type: 'bearer' })
        .expect(200);
      await http()
        .get(
          `/api/admin/collaborators/${scenario.candidates.available}/experience/${experienceId}/certificate`,
        )
        .auth(owner, { type: 'bearer' })
        .expect(403);
      // El líder no tiene perfil con esa experiencia: 404 (no revela que existe).
      await http()
        .get(certificateUrl())
        .auth(owner, { type: 'bearer' })
        .expect(404);
    });

    it('reemplaza por una imagen y rechaza archivos falsos o grandes', async () => {
      const replaced = await http()
        .put(certificateUrl())
        .auth(collaborator, { type: 'bearer' })
        .attach('file', PNG, {
          filename: 'foto.pdf',
          contentType: 'application/pdf',
        })
        .expect(200);
      expect(replaced.body.certificate).toMatchObject({
        fileName: 'foto.png',
        mimeType: 'image/png',
      });

      await http()
        .put(certificateUrl())
        .auth(collaborator, { type: 'bearer' })
        .attach('file', Buffer.from('<html></html>'), 'x.pdf')
        .expect(422);
      const tooBig = await http()
        .put(certificateUrl())
        .auth(collaborator, { type: 'bearer' })
        .attach(
          'file',
          Buffer.concat([PDF, Buffer.alloc(2 * 1024 * 1024)]),
          'big.pdf',
        )
        .expect(413);
      expect(tooBig.body.message).toContain('2 MB');
      await http()
        .put(certificateUrl())
        .auth(collaborator, { type: 'bearer' })
        .expect(400);
    });

    it('no deja quitar el certificado obligatorio, pero sí uno opcional', async () => {
      await http()
        .delete(certificateUrl())
        .auth(collaborator, { type: 'bearer' })
        .expect(422);

      const optional = await http()
        .post('/api/collaborators/me/experience')
        .auth(collaborator, { type: 'bearer' })
        .field('data', JSON.stringify({ ...work, type: 'PROYECTO_ACADEMICO' }))
        .attach('file', PDF, 'soporte.pdf')
        .expect(201);
      const optionalUrl = `/api/collaborators/me/experience/${optional.body.id}/certificate`;
      await http()
        .delete(optionalUrl)
        .auth(collaborator, { type: 'bearer' })
        .expect(204);
      await http()
        .get(optionalUrl)
        .auth(collaborator, { type: 'bearer' })
        .expect(404);
      await http()
        .delete(`/api/collaborators/me/experience/${optional.body.id}`)
        .auth(collaborator, { type: 'bearer' })
        .expect(204);
    });
  });

  describe('RF17 · gestionar personas', () => {
    let personId: string;
    const person = {
      email: 'Docente.Sin.Cuenta@ufps.edu.co',
      firstName: 'Marta',
      lastName: 'Rojas',
      personType: 'DOCENTE',
      programId: '',
      documentType: 'CC',
      documentNumber: '1094000111',
      phone: '3001112233',
      nationality: 'Colombiana',
      dataConsent: true,
      summary: 'Docente de redes y seguridad.',
    };

    it('el ADMIN registra una persona sin cuenta; duplicados 409; otros roles 403', async () => {
      const created = await http()
        .post('/api/admin/collaborators')
        .auth(admin, { type: 'bearer' })
        .send({ ...person, programId: scenario.programId })
        .expect(201);
      personId = created.body.id;
      expect(created.body).toMatchObject({
        email: 'docente.sin.cuenta@ufps.edu.co',
        source: 'ADMIN',
        dataConsent: true,
        user: null,
      });

      await http()
        .post('/api/admin/collaborators')
        .auth(admin, { type: 'bearer' })
        .send({
          ...person,
          programId: scenario.programId,
          documentNumber: '1094000222',
        })
        .expect(409);
      await http()
        .post('/api/admin/collaborators')
        .auth(admin, { type: 'bearer' })
        .send({
          ...person,
          programId: scenario.programId,
          email: 'otra@ufps.edu.co',
        })
        .expect(409);
      await http()
        .post('/api/admin/collaborators')
        .auth(owner, { type: 'bearer' })
        .send({ ...person, programId: scenario.programId })
        .expect(403);
    });

    it('corrige el perfil y la da de baja / la reactiva', async () => {
      const updated = await http()
        .patch(`/api/admin/collaborators/${personId}/profile`)
        .auth(admin, { type: 'bearer' })
        .send({
          availabilityStatus: 'PARCIAL',
          weeklyHours: 6,
          personType: 'ESTUDIANTE',
        })
        .expect(200);
      expect(updated.body).toMatchObject({
        availabilityStatus: 'PARCIAL',
        weeklyHours: 6,
        personType: 'ESTUDIANTE',
      });

      const off = await http()
        .patch(`/api/admin/collaborators/${personId}/status`)
        .auth(admin, { type: 'bearer' })
        .send({ active: false })
        .expect(200);
      expect(off.body.active).toBe(false);
      await http()
        .patch(`/api/admin/collaborators/${personId}/status`)
        .auth(admin, { type: 'bearer' })
        .send({ active: 'no' })
        .expect(422);
      const on = await http()
        .patch(`/api/admin/collaborators/${personId}/status`)
        .auth(admin, { type: 'bearer' })
        .send({ active: true })
        .expect(200);
      expect(on.body.active).toBe(true);
    });
  });

  describe('RF21–RF22 · convocatorias', () => {
    const url = () => `/api/projects/${scenario.projectId}/invitations`;
    const message =
      'Hola, tu perfil encaja con nuestro proyecto. ¿Te gustaría participar?';

    beforeAll(async () => {
      await http()
        .post(`/api/projects/${scenario.projectId}/analysis`)
        .auth(owner, { type: 'bearer' })
        .expect(201);
      await http()
        .post(`/api/projects/${scenario.projectId}/recommendations`)
        .auth(owner, { type: 'bearer' })
        .send({ includeUnavailable: true })
        .expect(200);
    });

    it('convoca a una persona recomendada, guarda el historial y no repite en 24 h', async () => {
      const response = await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .send({ collaboratorIds: [scenario.candidates.available], message })
        .expect(200);
      expect(response.body).toMatchObject({ sent: 1, failed: 0, skipped: [] });
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({
        to: 'disponible@prueba.test',
        replyTo: EMAILS.owner,
      });

      const again = await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .send({ collaboratorIds: [scenario.candidates.available], message })
        .expect(200);
      expect(again.body.sent).toBe(0);
      expect(again.body.skipped[0].reason).toBe('YA_CONVOCADA');
    });

    it('registra un envío fallido', async () => {
      failNextMail = true;
      const response = await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .send({ collaboratorIds: [scenario.candidates.unavailable], message })
        .expect(200);
      expect(response.body).toMatchObject({ sent: 0, failed: 1 });
    });

    it('rechaza a quien no fue recomendado, mensajes cortos y a otros líderes', async () => {
      await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .send({ collaboratorIds: [scenario.candidates.noConsent], message })
        .expect(422);
      await http()
        .post(url())
        .auth(owner, { type: 'bearer' })
        .send({
          collaboratorIds: [scenario.candidates.available],
          message: 'hola',
        })
        .expect(422);
      await http()
        .post(url())
        .auth(otherLeader, { type: 'bearer' })
        .send({ collaboratorIds: [scenario.candidates.available], message })
        .expect(403);
    });

    it('historial: el líder ve el correo enmascarado y el ADMIN completo', async () => {
      const leaderView = await http()
        .get(url())
        .auth(owner, { type: 'bearer' })
        .expect(200);
      expect(leaderView.body.invitations).toHaveLength(2);
      expect(
        leaderView.body.invitations
          .map((i: { status: string }) => i.status)
          .sort(),
      ).toEqual(['ENVIADA', 'FALLIDA']);
      expect(JSON.stringify(leaderView.body)).not.toContain(
        'disponible@prueba.test',
      );

      const adminView = await http()
        .get(url())
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(JSON.stringify(adminView.body)).toContain(
        'disponible@prueba.test',
      );
    });
  });

  describe('RF15–RF16 · estadísticas y reportes', () => {
    it('devuelve indicadores coherentes con la base', async () => {
      const ds = app.get(DataSource);
      const [{ count }] = await ds.query(
        `SELECT COUNT(*)::int AS count FROM collaborators`,
      );
      const response = await http()
        .get('/api/admin/stats')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      const stats = response.body;

      expect(stats.people.total).toBe(count);
      expect(stats.projects.total).toBe(2);
      expect(stats.projects.byType[0]).toMatchObject({
        key: 'INVESTIGACION',
        count: 2,
      });
      expect(stats.invitations).toEqual({ sent: 1, failed: 1 });
      expect(stats.profiles.recommendations).toBeGreaterThan(0);
      expect(stats.certificates.required).toBe(1);
      expect(
        stats.skills.topOffered.map((skill: { name: string }) => skill.name),
      ).toEqual(expect.arrayContaining(['Python', 'Bases de datos']));
      await http()
        .get('/api/admin/stats')
        .auth(owner, { type: 'bearer' })
        .expect(403);
    });

    it('genera los cinco reportes en Excel y CSV', async () => {
      for (const kind of [
        'proyectos',
        'personas',
        'habilidades',
        'recomendaciones',
        'convocatorias',
      ]) {
        const xlsx = await http()
          .get(`/api/admin/reports/${kind}`)
          .auth(admin, { type: 'bearer' })
          .buffer(true)
          .parse((res, done) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => done(null, Buffer.concat(chunks)));
          })
          .expect(200);
        expect(xlsx.headers['content-disposition']).toContain(
          `reporte-${kind}`,
        );
        const workbook = new Workbook();
        await workbook.xlsx.load(xlsx.body as ArrayBuffer);
        expect(workbook.worksheets[0].getCell('A4').value).toBeTruthy();
      }

      const csv = await http()
        .get('/api/admin/reports/personas?format=csv')
        .auth(admin, { type: 'bearer' })
        .expect(200);
      expect(csv.headers['content-type']).toContain('text/csv');
      expect(csv.text).toContain('Disponible Prueba');
      expect(csv.text).not.toContain('3000000099');

      await http()
        .get('/api/admin/reports/nominas')
        .auth(admin, { type: 'bearer' })
        .expect(404);
      await http()
        .get('/api/admin/reports/personas?format=pdf')
        .auth(admin, { type: 'bearer' })
        .expect(422);
    });
  });
});
