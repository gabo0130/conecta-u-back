import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  CountBy,
  InvitationReportRow,
  PersonReportRow,
  PlatformStats,
  ProjectReportRow,
  RecommendationReportRow,
  ReportingRepository,
  SkillBalance,
  StatsFilters,
} from '../../../domain/repositories/reporting.repository.interface';

const TOP = 10;
const CERTIFIED_TYPES = `('LABORAL','PRACTICA','DOCENCIA')`;

/**
 * Condiciones de los filtros con parámetros posicionales: un filtro vacío (`NULL`) no restringe.
 * Proyecto: $n desde, $n+1 hasta, $n+2 tipo, $n+3 categoría. Persona: $n programa, $n+1 tipo.
 */
const projectWhere = (alias: string, n: number) =>
  `($${n}::timestamptz IS NULL OR ${alias}."createdAt" >= $${n}) AND ($${n + 1}::timestamptz IS NULL OR ${alias}."createdAt" < $${n + 1}) AND ($${n + 2}::uuid IS NULL OR ${alias}."typeId" = $${n + 2}) AND ($${n + 3}::uuid IS NULL OR ${alias}."categoryId" = $${n + 3})`;
const personWhere = (alias: string, n: number) =>
  `($${n}::uuid IS NULL OR ${alias}."programId" = $${n}) AND ($${n + 1}::text IS NULL OR ${alias}."personType"::text = $${n + 1})`;

const projectParams = (filters: StatsFilters) => [
  filters.from ?? null,
  filters.to ?? null,
  filters.projectTypeId ?? null,
  filters.categoryId ?? null,
];
const personParams = (filters: StatsFilters) => [
  filters.programId ?? null,
  filters.personType ?? null,
];

// Oferta: personas activas y con autorización (las mismas que se recomiendan) que cumplen los
// filtros de persona ($1, $2). Demanda: perfiles activos de proyectos que cumplen los de proyecto ($3–$6).
const SKILL_BALANCE_SQL = `
  WITH offered AS (
    SELECT cs."skillId", COUNT(DISTINCT cs."collaboratorId")::int AS n
    FROM collaborator_skills cs
    JOIN collaborators c ON c.id = cs."collaboratorId" AND c.active AND c."dataConsent"
    WHERE ${personWhere('c', 1)}
    GROUP BY cs."skillId"
  ), demanded AS (
    SELECT rps."skillId", COUNT(DISTINCT rps."requiredProfileId")::int AS n
    FROM required_profile_skills rps
    JOIN required_profiles rp ON rp.id = rps."requiredProfileId" AND rp.active
    JOIN projects p ON p.id = rp."projectId"
    WHERE rps."skillId" IS NOT NULL AND ${projectWhere('p', 3)}
    GROUP BY rps."skillId"
  )
  SELECT s.id AS "skillId", s.name, s.type::text AS type,
         COALESCE(o.n, 0) AS offered, COALESCE(d.n, 0) AS demanded
  FROM skills s
  LEFT JOIN offered o ON o."skillId" = s.id
  LEFT JOIN demanded d ON d."skillId" = s.id
  WHERE COALESCE(o.n, 0) + COALESCE(d.n, 0) > 0`;

interface RawCount {
  key: string | null;
  label: string | null;
  count: string | number;
}

function toCounts(rows: RawCount[]): CountBy[] {
  return rows.map((row) => ({
    key: row.key ?? 'SIN_DATO',
    label: row.label ?? row.key ?? 'Sin dato',
    count: Number(row.count),
  }));
}

const num = (value: unknown): number => Number(value ?? 0);

@Injectable()
export class TypeOrmReportingRepository implements ReportingRepository {
  constructor(private readonly dataSource: DataSource) {}

  private query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.dataSource.query(sql, params);
  }

  private async one<T>(sql: string, params: unknown[] = []): Promise<T> {
    const [row] = await this.query<T>(sql, params);
    return row;
  }

  private counts(sql: string, params: unknown[] = []): Promise<CountBy[]> {
    return this.query<RawCount>(sql, params).then(toCounts);
  }

  async getStats(
    filters: StatsFilters,
    now = new Date(),
  ): Promise<PlatformStats> {
    const since = new Date(now.getTime() - 30 * 86_400_000);
    const project = projectParams(filters);
    const person = personParams(filters);
    const [
      projectTotals,
      byStatus,
      byType,
      byCategory,
      people,
      byPersonType,
      bySource,
      byProgram,
      availability,
      byAvailability,
      users,
      byRole,
      profiles,
      skillsCatalog,
      balance,
      certificates,
      invitations,
    ] = await Promise.all([
      this.one<{ total: string; recent: string }>(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE p."createdAt" >= $5) AS recent
         FROM projects p WHERE ${projectWhere('p', 1)}`,
        [...project, since],
      ),
      this.counts(
        `SELECT p.status::text AS key, p.status::text AS label, COUNT(*) AS count
         FROM projects p WHERE ${projectWhere('p', 1)}
         GROUP BY p.status ORDER BY count DESC`,
        project,
      ),
      this.counts(
        `SELECT t.code AS key, t.name AS label, COUNT(p.id) AS count
         FROM project_types t LEFT JOIN projects p ON p."typeId" = t.id AND ${projectWhere('p', 1)}
         WHERE $3::uuid IS NULL OR t.id = $3
         GROUP BY t.id ORDER BY count DESC, t.name`,
        project,
      ),
      this.counts(
        `SELECT c.id::text AS key, c.name AS label, COUNT(p.id) AS count
         FROM project_categories c LEFT JOIN projects p ON p."categoryId" = c.id AND ${projectWhere('p', 1)}
         WHERE $4::uuid IS NULL OR c.id = $4
         GROUP BY c.id ORDER BY count DESC, c.name`,
        project,
      ),
      this.one<Record<string, string>>(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE active) AS active,
                COUNT(*) FILTER (WHERE "userId" IS NOT NULL) AS "withAccount",
                COUNT(*) FILTER (WHERE "dataConsent") AS "withConsent",
                COUNT(*) FILTER (WHERE "truthfulnessDeclared") AS "truthfulness"
         FROM collaborators c WHERE ${personWhere('c', 1)}`,
        person,
      ),
      this.counts(
        `SELECT c."personType"::text AS key, c."personType"::text AS label, COUNT(*) AS count
         FROM collaborators c WHERE c.active AND ${personWhere('c', 1)}
         GROUP BY c."personType" ORDER BY count DESC`,
        person,
      ),
      this.counts(
        `SELECT c.source::text AS key, c.source::text AS label, COUNT(*) AS count
         FROM collaborators c WHERE ${personWhere('c', 1)}
         GROUP BY c.source ORDER BY count DESC`,
        person,
      ),
      this.counts(
        `SELECT p.code AS key, p.name AS label, COUNT(*) AS count
         FROM collaborators c JOIN programs p ON p.id = c."programId"
         WHERE c.active AND ${personWhere('c', 1)}
         GROUP BY p.id ORDER BY count DESC, p.name LIMIT ${TOP}`,
        person,
      ),
      this.one<{ avg: string | null; total: string | null }>(
        `SELECT AVG(c."weeklyHours") AS avg,
                SUM(c."weeklyHours") FILTER (WHERE c."availabilityStatus" <> 'NO_DISPONIBLE') AS total
         FROM collaborators c WHERE c.active AND c."dataConsent" AND ${personWhere('c', 1)}`,
        person,
      ),
      this.counts(
        `SELECT c."availabilityStatus"::text AS key, c."availabilityStatus"::text AS label, COUNT(*) AS count
         FROM collaborators c WHERE c.active AND c."dataConsent" AND ${personWhere('c', 1)}
         GROUP BY c."availabilityStatus" ORDER BY count DESC`,
        person,
      ),
      this.one<{ total: string; active: string }>(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE active) AS active FROM users`,
      ),
      this.counts(
        `SELECT role::text AS key, role::text AS label, COUNT(*) AS count FROM users GROUP BY role ORDER BY count DESC`,
      ),
      this.one<Record<string, string | null>>(
        `WITH p AS (SELECT p.id FROM projects p WHERE ${projectWhere('p', 1)}),
              rec AS (SELECT r.score, r.rank, rp."projectId" FROM recommendations r
                      JOIN required_profiles rp ON rp.id = r."requiredProfileId"
                      WHERE rp."projectId" IN (SELECT id FROM p))
         SELECT
           (SELECT COUNT(*) FROM required_profiles WHERE active AND "projectId" IN (SELECT id FROM p)) AS "activeProfiles",
           (SELECT COUNT(*) FROM project_analyses WHERE status = 'COMPLETADO' AND "projectId" IN (SELECT id FROM p)) AS "analysesCompleted",
           (SELECT COUNT(*) FROM project_analyses WHERE status = 'ERROR' AND "projectId" IN (SELECT id FROM p)) AS "analysesFailed",
           (SELECT COUNT(DISTINCT "projectId") FROM rec) AS "projectsWithRecommendations",
           (SELECT COUNT(*) FROM rec) AS recommendations,
           (SELECT AVG(score) FROM rec WHERE rank = 1) AS "averageTopScore"`,
        project,
      ),
      this.one<{ active: string; pending: string }>(
        `SELECT COUNT(*) FILTER (WHERE status = 'ACTIVA') AS active,
                COUNT(*) FILTER (WHERE status = 'PENDIENTE') AS pending FROM skills`,
      ),
      this.skillRows(filters),
      this.one<{ required: string; uploaded: string }>(
        `SELECT COUNT(*) AS required, COUNT(ec."experienceId") AS uploaded
         FROM experiences e
         JOIN collaborators c ON c.id = e."collaboratorId"
         LEFT JOIN experience_certificates ec ON ec."experienceId" = e.id
         WHERE e.type::text IN ${CERTIFIED_TYPES} AND ${personWhere('c', 1)}`,
        person,
      ),
      this.one<{ sent: string; failed: string }>(
        `SELECT COUNT(*) FILTER (WHERE i.status = 'ENVIADA') AS sent,
                COUNT(*) FILTER (WHERE i.status = 'FALLIDA') AS failed
         FROM invitations i JOIN projects p ON p.id = i."projectId"
         WHERE ${projectWhere('p', 1)}`,
        project,
      ),
    ]);

    const demandedSkills = balance.filter((skill) => skill.demanded > 0);
    return {
      generatedAt: now,
      projects: {
        total: num(projectTotals.total),
        createdLast30Days: num(projectTotals.recent),
        byStatus,
        byType,
        byCategory,
      },
      people: {
        total: num(people.total),
        active: num(people.active),
        withAccount: num(people.withAccount),
        withConsent: num(people.withConsent),
        truthfulnessDeclared: num(people.truthfulness),
        byPersonType,
        bySource,
        byProgram,
      },
      availability: {
        byStatus: byAvailability,
        averageWeeklyHours:
          availability.avg === null
            ? 0
            : Math.round(num(availability.avg) * 10) / 10,
        totalWeeklyHoursAvailable: num(availability.total),
      },
      users: { total: num(users.total), active: num(users.active), byRole },
      profiles: {
        activeRequiredProfiles: num(profiles.activeProfiles),
        analysesCompleted: num(profiles.analysesCompleted),
        analysesFailed: num(profiles.analysesFailed),
        projectsWithRecommendations: num(profiles.projectsWithRecommendations),
        recommendations: num(profiles.recommendations),
        averageTopScore:
          profiles.averageTopScore === null
            ? null
            : Math.round(num(profiles.averageTopScore) * 10) / 10,
      },
      skills: {
        catalogActive: num(skillsCatalog.active),
        pendingApproval: num(skillsCatalog.pending),
        topOffered: [...balance]
          .sort((a, b) => b.offered - a.offered || a.name.localeCompare(b.name))
          .filter((skill) => skill.offered > 0)
          .slice(0, TOP),
        topDemanded: [...demandedSkills]
          .sort(
            (a, b) => b.demanded - a.demanded || a.name.localeCompare(b.name),
          )
          .slice(0, TOP),
        gaps: [...demandedSkills]
          .sort(
            (a, b) =>
              a.offered / a.demanded - b.offered / b.demanded ||
              b.demanded - a.demanded,
          )
          .slice(0, TOP),
      },
      certificates: {
        required: num(certificates.required),
        uploaded: num(certificates.uploaded),
      },
      invitations: {
        sent: num(invitations.sent),
        failed: num(invitations.failed),
      },
    };
  }

  async skillRows(filters: StatsFilters = {}): Promise<SkillBalance[]> {
    const rows = await this.query<SkillBalance>(
      `${SKILL_BALANCE_SQL} ORDER BY demanded DESC, offered DESC, name`,
      [...personParams(filters), ...projectParams(filters)],
    );
    return rows.map((row) => ({
      ...row,
      offered: num(row.offered),
      demanded: num(row.demanded),
    }));
  }

  async projectRows(): Promise<ProjectReportRow[]> {
    const rows = await this.query<ProjectReportRow>(
      `SELECT p.title, t.name AS type, c.name AS category, pr.name AS program,
              p.status::text AS status, u."fullName" AS leader,
              p."executingEntity", p."sponsorEntity", p."durationMonths",
              (SELECT COUNT(*) FROM deliverables d WHERE d."projectId" = p.id)::int AS deliverables,
              (SELECT COUNT(*) FROM required_profiles rp WHERE rp."projectId" = p.id AND rp.active)::int AS "requiredProfiles",
              (SELECT COUNT(*) FROM recommendations r JOIN required_profiles rp ON rp.id = r."requiredProfileId"
                 WHERE rp."projectId" = p.id)::int AS recommendations,
              (SELECT COUNT(*) FROM invitations i WHERE i."projectId" = p.id AND i.status = 'ENVIADA')::int AS "invitationsSent",
              p."createdAt"
       FROM projects p
       JOIN project_types t ON t.id = p."typeId"
       JOIN project_categories c ON c.id = p."categoryId"
       LEFT JOIN programs pr ON pr.id = p."programId"
       JOIN users u ON u.id = p."leaderId"
       ORDER BY p."createdAt" DESC`,
    );
    return rows;
  }

  async personRows(): Promise<PersonReportRow[]> {
    return this.query<PersonReportRow>(
      `SELECT c."firstName" || ' ' || c."lastName" AS "fullName", c.email,
              c."personType"::text AS "personType", p.name AS program, c.semester,
              c."researchGroup", c."availabilityStatus"::text AS "availabilityStatus",
              c."weeklyHours",
              (SELECT COUNT(*) FROM collaborator_skills cs WHERE cs."collaboratorId" = c.id)::int AS skills,
              (SELECT COUNT(*) FROM experiences e WHERE e."collaboratorId" = c.id)::int AS experiences,
              (SELECT COUNT(*) FROM experiences e
                 LEFT JOIN experience_certificates ec ON ec."experienceId" = e.id
                 WHERE e."collaboratorId" = c.id AND e.type::text IN ${CERTIFIED_TYPES}
                   AND ec."experienceId" IS NULL)::int AS "certificatesPending",
              c."userId" IS NOT NULL AS "hasAccount", c."dataConsent", c."truthfulnessDeclared",
              c.active, c.source::text AS source
       FROM collaborators c JOIN programs p ON p.id = c."programId"
       ORDER BY c."firstName", c."lastName"`,
    );
  }

  async recommendationRows(): Promise<RecommendationReportRow[]> {
    const rows = await this.query<RecommendationReportRow>(
      `SELECT pj.title AS project, rp.name AS profile, r.rank,
              c."firstName" || ' ' || c."lastName" AS person, c."personType"::text AS "personType",
              pr.name AS program, r.score, r."skillScore", r."semanticScore",
              r."experienceScore", r."availabilityScore", r."generatedAt"
       FROM recommendations r
       JOIN required_profiles rp ON rp.id = r."requiredProfileId" AND rp.active
       JOIN projects pj ON pj.id = rp."projectId"
       JOIN collaborators c ON c.id = r."collaboratorId"
       JOIN programs pr ON pr.id = c."programId"
       ORDER BY pj.title, rp.position, r.rank`,
    );
    return rows.map((row) => ({
      ...row,
      score: num(row.score),
      skillScore: num(row.skillScore),
      semanticScore: num(row.semanticScore),
      experienceScore: num(row.experienceScore),
      availabilityScore: num(row.availabilityScore),
    }));
  }

  async invitationRows(): Promise<InvitationReportRow[]> {
    return this.query<InvitationReportRow>(
      `SELECT pj.title AS project, i."profileName" AS profile, i."recipientName" AS recipient,
              i.status::text AS status, u."fullName" AS "sentBy", i."sentAt"
       FROM invitations i
       JOIN projects pj ON pj.id = i."projectId"
       LEFT JOIN users u ON u.id = i."sentById"
       ORDER BY i."sentAt" DESC`,
    );
  }
}
