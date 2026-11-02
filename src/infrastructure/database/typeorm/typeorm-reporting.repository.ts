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
} from '../../../domain/repositories/reporting.repository.interface';

const TOP = 10;
const CERTIFIED_TYPES = `('LABORAL','PRACTICA','DOCENCIA')`;

// Personas que cuentan como oferta: activas y con autorización (las mismas que se recomiendan).
const SKILL_BALANCE_SQL = `
  WITH offered AS (
    SELECT cs."skillId", COUNT(DISTINCT cs."collaboratorId")::int AS n
    FROM collaborator_skills cs
    JOIN collaborators c ON c.id = cs."collaboratorId" AND c.active AND c."dataConsent"
    GROUP BY cs."skillId"
  ), demanded AS (
    SELECT rps."skillId", COUNT(DISTINCT rps."requiredProfileId")::int AS n
    FROM required_profile_skills rps
    JOIN required_profiles rp ON rp.id = rps."requiredProfileId" AND rp.active
    WHERE rps."skillId" IS NOT NULL
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

  async getStats(now = new Date()): Promise<PlatformStats> {
    const since = new Date(now.getTime() - 30 * 86_400_000);
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
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE "createdAt" >= $1) AS recent FROM projects`,
        [since],
      ),
      this.counts(
        `SELECT status::text AS key, status::text AS label, COUNT(*) AS count FROM projects GROUP BY status ORDER BY count DESC`,
      ),
      this.counts(
        `SELECT t.code AS key, t.name AS label, COUNT(p.id) AS count
         FROM project_types t LEFT JOIN projects p ON p."typeId" = t.id
         GROUP BY t.id ORDER BY count DESC, t.name`,
      ),
      this.counts(
        `SELECT c.id::text AS key, c.name AS label, COUNT(p.id) AS count
         FROM project_categories c LEFT JOIN projects p ON p."categoryId" = c.id
         GROUP BY c.id ORDER BY count DESC, c.name`,
      ),
      this.one<Record<string, string>>(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE active) AS active,
                COUNT(*) FILTER (WHERE "userId" IS NOT NULL) AS "withAccount",
                COUNT(*) FILTER (WHERE "dataConsent") AS "withConsent",
                COUNT(*) FILTER (WHERE "truthfulnessDeclared") AS "truthfulness"
         FROM collaborators`,
      ),
      this.counts(
        `SELECT "personType"::text AS key, "personType"::text AS label, COUNT(*) AS count
         FROM collaborators WHERE active GROUP BY "personType" ORDER BY count DESC`,
      ),
      this.counts(
        `SELECT source::text AS key, source::text AS label, COUNT(*) AS count
         FROM collaborators GROUP BY source ORDER BY count DESC`,
      ),
      this.counts(
        `SELECT p.code AS key, p.name AS label, COUNT(*) AS count
         FROM collaborators c JOIN programs p ON p.id = c."programId"
         WHERE c.active GROUP BY p.id ORDER BY count DESC, p.name LIMIT ${TOP}`,
      ),
      this.one<{ avg: string | null; total: string | null }>(
        `SELECT AVG("weeklyHours") AS avg,
                SUM("weeklyHours") FILTER (WHERE "availabilityStatus" <> 'NO_DISPONIBLE') AS total
         FROM collaborators WHERE active AND "dataConsent"`,
      ),
      this.counts(
        `SELECT "availabilityStatus"::text AS key, "availabilityStatus"::text AS label, COUNT(*) AS count
         FROM collaborators WHERE active AND "dataConsent"
         GROUP BY "availabilityStatus" ORDER BY count DESC`,
      ),
      this.one<{ total: string; active: string }>(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE active) AS active FROM users`,
      ),
      this.counts(
        `SELECT role::text AS key, role::text AS label, COUNT(*) AS count FROM users GROUP BY role ORDER BY count DESC`,
      ),
      this.one<Record<string, string | null>>(
        `SELECT
           (SELECT COUNT(*) FROM required_profiles WHERE active) AS "activeProfiles",
           (SELECT COUNT(*) FROM project_analyses WHERE status = 'COMPLETADO') AS "analysesCompleted",
           (SELECT COUNT(*) FROM project_analyses WHERE status = 'ERROR') AS "analysesFailed",
           (SELECT COUNT(DISTINCT rp."projectId") FROM recommendations r
              JOIN required_profiles rp ON rp.id = r."requiredProfileId") AS "projectsWithRecommendations",
           (SELECT COUNT(*) FROM recommendations) AS recommendations,
           (SELECT AVG(score) FROM recommendations WHERE rank = 1) AS "averageTopScore"`,
      ),
      this.one<{ active: string; pending: string }>(
        `SELECT COUNT(*) FILTER (WHERE status = 'ACTIVA') AS active,
                COUNT(*) FILTER (WHERE status = 'PENDIENTE') AS pending FROM skills`,
      ),
      this.skillRows(),
      this.one<{ required: string; uploaded: string }>(
        `SELECT COUNT(*) AS required, COUNT(ec."experienceId") AS uploaded
         FROM experiences e LEFT JOIN experience_certificates ec ON ec."experienceId" = e.id
         WHERE e.type::text IN ${CERTIFIED_TYPES}`,
      ),
      this.one<{ sent: string; failed: string }>(
        `SELECT COUNT(*) FILTER (WHERE status = 'ENVIADA') AS sent,
                COUNT(*) FILTER (WHERE status = 'FALLIDA') AS failed FROM invitations`,
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

  async skillRows(): Promise<SkillBalance[]> {
    const rows = await this.query<SkillBalance>(
      `${SKILL_BALANCE_SQL} ORDER BY demanded DESC, offered DESC, name`,
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
