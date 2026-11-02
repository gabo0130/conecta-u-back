import 'dotenv/config';
import { Client } from 'pg';
import { normalizeSkillName } from '../../src/shared/utils/normalize-skill-name';
import { generatePeople } from './dataset';

// Carga personas sintéticas en una base de DESARROLLO o DEMO (nunca en producción): reemplaza
// las anteriores con el dominio `sintetico.conectau.test`. Requiere migraciones y `npm run seed`.
//   npx ts-node scripts/synthetic/seed-synthetic.ts --count 150 [--seed 20261102]

const SYNTHETIC_DOMAIN = '@sintetico.conectau.test';

function arg(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? Number(process.argv[index + 1]) : fallback;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Define DATABASE_URL');
  if (process.env.NODE_ENV === 'production' || /render\.com|prod/i.test(url)) {
    throw new Error('Este script es solo para bases de desarrollo o demostración.');
  }
  const count = arg('count', 150);
  const people = generatePeople(count, arg('seed', 20261102));
  const client = new Client({ connectionString: url, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM collaborators WHERE email LIKE $1`, [`%${SYNTHETIC_DOMAIN}`]);

    const skills = new Map<string, string>(
      (await client.query<{ id: string; normalizedName: string }>(`SELECT id, "normalizedName" FROM skills`)).rows.map((row) => [row.normalizedName, row.id]),
    );
    const programs = new Map<string, string>(
      (await client.query<{ id: string; code: string }>(`SELECT id, code FROM programs`)).rows.map((row) => [row.code, row.id]),
    );
    const skillId = (name: string) => {
      const id = skills.get(normalizeSkillName(name));
      if (!id) throw new Error(`La habilidad "${name}" no está en el catálogo (corre npm run seed).`);
      return id;
    };

    let documentNumber = 1_900_000_000;
    for (const person of people) {
      const programId = programs.get(person.program);
      if (!programId) throw new Error(`Programa ${person.program} no existe`);
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO collaborators (email, "firstName", "lastName", "personType", "programId", semester, summary,
           "availabilityStatus", "weeklyHours", "dataConsent", "dataConsentAt", "truthfulnessDeclared", "truthfulnessDeclaredAt",
           source, "documentType", "documentNumber", phone, nationality)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,now(),true,now(),'IMPORTACION','CC',$10,'3000000000','Colombiana') RETURNING id`,
        [person.email, person.firstName, person.lastName, person.personType, programId, person.semester, person.summary,
          person.availabilityStatus, person.weeklyHours, String(documentNumber++)],
      );
      const collaboratorId = rows[0].id;
      for (const skill of person.skills) {
        await client.query(
          `INSERT INTO collaborator_skills ("collaboratorId", "skillId", level, "experienceMonths", "lastUsedYear") VALUES ($1,$2,$3,$4,$5)`,
          [collaboratorId, skillId(skill.name), skill.level, skill.months, skill.lastUsedYear],
        );
      }
      for (const experience of person.experiences) {
        const { rows: exp } = await client.query<{ id: string }>(
          `INSERT INTO experiences ("collaboratorId", type, role, organization, "startDate", "endDate", current, "weeklyHours", level)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [collaboratorId, experience.type, experience.role, experience.organization, experience.startDate,
            experience.endDate, experience.endDate === null, experience.weeklyHours, experience.level],
        );
        for (const technology of experience.technologies) {
          await client.query(`INSERT INTO experience_skills ("experienceId", "skillId") VALUES ($1,$2) ON CONFLICT DO NOTHING`, [exp[0].id, skillId(technology)]);
        }
      }
    }
    await client.query('COMMIT');
    console.log(`Se cargaron ${people.length} personas sintéticas (${SYNTHETIC_DOMAIN}). Reconstruye los embeddings con POST /admin/embeddings/rebuild.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
