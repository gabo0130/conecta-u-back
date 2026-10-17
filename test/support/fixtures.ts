import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { normalizeSkillName } from '../../src/shared/utils/normalize-skill-name';
import { TEST_PASSWORD } from './test-app';

// Datos ficticios mínimos para recorrer análisis, perfiles y recomendaciones por HTTP.

export const EMAILS = {
  owner: 'lider.duena@prueba.test',
  otherLeader: 'otro.lider@prueba.test',
  admin: 'admin@prueba.test',
  collaborator: 'colaborador@prueba.test',
} as const;

export interface Scenario {
  projectId: string;
  incompleteProjectId: string;
  skillIds: Record<'python' | 'databases' | 'management' | 'teamwork', string>;
  candidates: Record<'available' | 'unavailable' | 'noConsent', string>;
  ownerCollaboratorId: string;
}

/** Vacía todas las tablas de datos (no las migraciones). */
export async function resetData(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  const rows: { tablename: string }[] = await ds.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'migrations'`,
  );
  const tables = rows.map((row) => `"${row.tablename}"`).join(', ');
  await ds.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
}

export async function seedScenario(app: INestApplication): Promise<Scenario> {
  const ds = app.get(DataSource);
  const insert = async (sql: string, params: unknown[]): Promise<string> => {
    const [row]: { id: string }[] = await ds.query(
      `${sql} RETURNING id`,
      params,
    );
    return row.id;
  };
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  const user = (fullName: string, email: string, role: string) =>
    insert(
      `INSERT INTO users ("fullName", email, password_hash, role) VALUES ($1, $2, $3, $4)`,
      [fullName, email, passwordHash, role],
    );

  const ownerId = await user('Líder Dueña', EMAILS.owner, 'LIDER');
  await user('Otro Líder', EMAILS.otherLeader, 'LIDER');
  await user('Admin Prueba', EMAILS.admin, 'ADMIN');
  const collaboratorUserId = await user(
    'Colaborador Prueba',
    EMAILS.collaborator,
    'COLABORADOR',
  );

  const programId = await insert(
    `INSERT INTO programs (code, name) VALUES ('ISIS', 'Ingeniería de Sistemas')`,
    [],
  );
  const typeId = await insert(
    `INSERT INTO project_types (code, name) VALUES ('INVESTIGACION', 'Investigación')`,
    [],
  );
  const categoryId = await insert(
    `INSERT INTO project_categories (name) VALUES ('Tecnología')`,
    [],
  );

  const skill = (name: string, type: string) =>
    insert(
      `INSERT INTO skills (name, type, "normalizedName") VALUES ($1, $2, $3)`,
      [name, type, normalizeSkillName(name)],
    );
  const skillIds = {
    python: await skill('Python', 'CONOCIMIENTO'),
    databases: await skill('Bases de datos', 'CONOCIMIENTO'),
    management: await skill('Gestión de proyectos', 'COMPETENCIA'),
    teamwork: await skill('Trabajo en equipo', 'HABILIDAD_BLANDA'),
  };

  const project = (title: string, objectives: string) =>
    insert(
      `INSERT INTO projects (title, summary, objectives, "leaderId", "typeId", "categoryId", "programId")
       VALUES ($1, 'Plataforma para registrar y analizar datos con Python y bases de datos.', $2, $3, $4, $5, $6)`,
      [title, objectives, ownerId, typeId, categoryId, programId],
    );
  const projectId = await project(
    'Proyecto de integración',
    'Construir un prototipo en Python con bases de datos.',
  );
  await ds.query(
    `INSERT INTO deliverables ("projectId", name, scope) VALUES ($1, 'Prototipo', 'Aplicación funcional')`,
    [projectId],
  );
  const incompleteProjectId = await project('Proyecto sin objetivos', '');

  const collaborator = async (
    firstName: string,
    options: { availability: string; consent: boolean; userId?: string },
  ) => {
    const id = await insert(
      `INSERT INTO collaborators (email, "firstName", "lastName", "personType", "programId", "availabilityStatus",
         "weeklyHours", "dataConsent", summary, "userId")
       VALUES ($1, $2, 'Prueba', 'ESTUDIANTE', $3, $4, 10, $5, 'Desarrollo en Python y bases de datos.', $6)`,
      [
        `${firstName.toLowerCase()}@prueba.test`,
        firstName,
        programId,
        options.availability,
        options.consent,
        options.userId ?? null,
      ],
    );
    await ds.query(
      `INSERT INTO collaborator_skills ("collaboratorId", "skillId", level, "experienceMonths")
       VALUES ($1, $2, 'AVANZADO', 24), ($1, $3, 'INTERMEDIO', 12)`,
      [id, skillIds.python, skillIds.databases],
    );
    return id;
  };

  return {
    projectId,
    incompleteProjectId,
    skillIds,
    candidates: {
      available: await collaborator('Disponible', {
        availability: 'DISPONIBLE',
        consent: true,
        // Tiene cuenta (COLABORADOR): puede retirar su consentimiento por la API.
        userId: collaboratorUserId,
      }),
      unavailable: await collaborator('Ocupada', {
        availability: 'NO_DISPONIBLE',
        consent: true,
      }),
      noConsent: await collaborator('Reservada', {
        availability: 'DISPONIBLE',
        consent: false,
      }),
    },
    // El propio líder también tiene perfil técnico: nunca debe recomendarse en su proyecto.
    ownerCollaboratorId: await collaborator('Lider', {
      availability: 'DISPONIBLE',
      consent: true,
      userId: ownerId,
    }),
  };
}
