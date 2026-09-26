import { MigrationInterface, QueryRunner } from "typeorm";

export class RestructureCollaboratorAndProjectModel1790355369034 implements MigrationInterface {
    name = 'RestructureCollaboratorAndProjectModel1790355369034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agrega columnas NOT NULL sin equivalente en el modelo anterior: solo corre sobre tablas
        // vacías. Se verifica antes de tocar nada para fallar con un mensaje claro (ver README).
        for (const table of ['users', 'collaborators', 'skills', 'experiences', 'projects']) {
            const [{ count }] = await queryRunner.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
            if (count > 0) {
                throw new Error(
                    `La migración al modelo v2.0 requiere la tabla "${table}" vacía (tiene ${count} filas). ` +
                    'Confirma que los datos son descartables, vacíalas con TRUNCATE ... CASCADE y vuelve a correr migration:run.',
                );
            }
        }

        await queryRunner.query(`ALTER TABLE "skills" DROP CONSTRAINT "FK_80dfdf58503c0398fec3f49ba59"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP CONSTRAINT "FK_e5b82c5ada6a6557ec22f219b30"`);
        await queryRunner.query(`ALTER TABLE "experiences" DROP CONSTRAINT "FK_0b2edf89c2ce5a23ea09f37f222"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "program" TO "active"`);
        await queryRunner.query(`CREATE TYPE "public"."collaborator_skills_level_enum" AS ENUM('BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO')`);
        await queryRunner.query(`CREATE TABLE "collaborator_skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "collaboratorId" uuid NOT NULL, "skillId" uuid NOT NULL, "level" "public"."collaborator_skills_level_enum" NOT NULL, "experienceMonths" smallint NOT NULL, "lastUsedYear" smallint, CONSTRAINT "UQ_1f14dc9372f7f32c911444073a8" UNIQUE ("collaboratorId", "skillId"), CONSTRAINT "PK_a914ec0015ff7e58b44c812e9b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "programs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(20) NOT NULL, "name" character varying(120) NOT NULL, "faculty" character varying(120), "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_11924ca2e0cb47a8d9400bada03" UNIQUE ("code"), CONSTRAINT "PK_d43c664bcaafc0e8a06dfd34e05" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(80) NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_8270e7fe222cdc03f77a9fda58f" UNIQUE ("name"), CONSTRAINT "PK_03d7af35c2601369d030b3617bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(40) NOT NULL, "name" character varying(80) NOT NULL, "templateFields" jsonb NOT NULL DEFAULT '[]', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_5f493a96643ff6f928bf5e94315" UNIQUE ("code"), CONSTRAINT "PK_a92511c5000b6b331876bbbce08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "deliverables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "name" character varying(140) NOT NULL, "scope" text NOT NULL, CONSTRAINT "PK_13367f7b271fb2b95ccb18d78a3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "experience_skills" ("experienceId" uuid NOT NULL, "skillId" uuid NOT NULL, CONSTRAINT "PK_292a0245d8ffbaabdaaba5fb741" PRIMARY KEY ("experienceId", "skillId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fa99fda757c5d7775f8559f062" ON "experience_skills" ("experienceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f7a7dfa66dca37429e8c4e3335" ON "experience_skills" ("skillId") `);
        await queryRunner.query(`CREATE TABLE "project_skills" ("projectId" uuid NOT NULL, "skillId" uuid NOT NULL, CONSTRAINT "PK_191b202fe8fdcacf4b353fe2aef" PRIMARY KEY ("projectId", "skillId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8cbc0f1e52a4bfaf783108f99c" ON "project_skills" ("projectId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a60e9e349e2e6cbe2cf73b1fbd" ON "project_skills" ("skillId") `);
        await queryRunner.query(`ALTER TABLE "skills" DROP COLUMN "collaboratorId"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP COLUMN "level"`);
        await queryRunner.query(`ALTER TABLE "experiences" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "experiences" DROP COLUMN "period"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "headline"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "modality"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "studyGroup"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "knownSkills"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "semillero"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "program"`);
        await queryRunner.query(`ALTER TABLE "skills" ADD "normalizedName" character varying(80) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "skills" ADD CONSTRAINT "UQ_c2823e39a34b6628b85feb5ffbb" UNIQUE ("normalizedName")`);
        await queryRunner.query(`CREATE TYPE "public"."skills_category_enum" AS ENUM('LENGUAJE', 'FRAMEWORK', 'BASE_DATOS', 'NUBE_DEVOPS', 'DATOS_IA', 'DISENO_UX', 'HERRAMIENTA', 'METODOLOGIA', 'GESTION', 'COMUNICACION', 'TRABAJO_EQUIPO', 'LIDERAZGO', 'OTRA')`);
        await queryRunner.query(`ALTER TABLE "skills" ADD "category" "public"."skills_category_enum" NOT NULL DEFAULT 'OTRA'`);
        await queryRunner.query(`ALTER TABLE "skills" ADD "synonyms" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`CREATE TYPE "public"."skills_status_enum" AS ENUM('ACTIVA', 'PENDIENTE')`);
        await queryRunner.query(`ALTER TABLE "skills" ADD "status" "public"."skills_status_enum" NOT NULL DEFAULT 'ACTIVA'`);
        await queryRunner.query(`CREATE TYPE "public"."experiences_type_enum" AS ENUM('LABORAL', 'PRACTICA', 'PROYECTO_ACADEMICO', 'SEMILLERO_INVESTIGACION', 'PROYECTO_PERSONAL', 'VOLUNTARIADO', 'DOCENCIA')`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "type" "public"."experiences_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "role" character varying(120) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "startDate" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "endDate" date`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "current" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "weeklyHours" smallint NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."experiences_level_enum" AS ENUM('BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO')`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "level" "public"."experiences_level_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP CONSTRAINT "PK_e5b82c5ada6a6557ec22f219b30"`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "PK_d2bf48acc6d412fae80aa674ce8" PRIMARY KEY ("userId", "id")`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "UQ_b210f505222bd59004a77165857" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "firstName" character varying(80) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "lastName" character varying(80) NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."collaborators_persontype_enum" AS ENUM('ESTUDIANTE', 'DOCENTE')`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "personType" "public"."collaborators_persontype_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "programId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "semester" smallint`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "researchGroup" character varying(160)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "summary" text`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "profileUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "dataConsent" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "dataConsentAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE TYPE "public"."collaborators_source_enum" AS ENUM('REGISTRO', 'ADMIN', 'IMPORTACION')`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "source" "public"."collaborators_source_enum" NOT NULL DEFAULT 'REGISTRO'`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "typeId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "categoryId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "programId" uuid`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "typeData" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TYPE "public"."skills_type_enum" RENAME TO "skills_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."skills_type_enum" AS ENUM('CONOCIMIENTO', 'COMPETENCIA', 'HABILIDAD_BLANDA')`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "skills" ALTER COLUMN "type" TYPE "public"."skills_type_enum" USING "type"::"text"::"public"."skills_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."skills_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "experiences" DROP COLUMN "organization"`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD "organization" character varying(160) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP CONSTRAINT "PK_d2bf48acc6d412fae80aa674ce8"`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "PK_f579a5df9d66287f400806ad875" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "collaborators" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "UQ_e5b82c5ada6a6557ec22f219b30" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "weeklyHours"`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "weeklyHours" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "collaborator_skills" ADD CONSTRAINT "FK_2c6c27d74ccc8e8cb6458c472d1" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collaborator_skills" ADD CONSTRAINT "FK_1094d090166a57f099a9c89c2a0" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD CONSTRAINT "FK_0b2edf89c2ce5a23ea09f37f222" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "FK_e5b82c5ada6a6557ec22f219b30" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "FK_18f40eb832fa18226fd72cec48e" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_a573d9e58cc758d53ae9371ed34" FOREIGN KEY ("typeId") REFERENCES "project_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_b7d7d44e0e33834351af221757d" FOREIGN KEY ("categoryId") REFERENCES "project_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_b6f108b63cbcf38b1fa3c3a69e7" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deliverables" ADD CONSTRAINT "FK_aa4b7aaf46037568e3af653c2b3" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experience_skills" ADD CONSTRAINT "FK_fa99fda757c5d7775f8559f0627" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "experience_skills" ADD CONSTRAINT "FK_f7a7dfa66dca37429e8c4e33359" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "project_skills" ADD CONSTRAINT "FK_8cbc0f1e52a4bfaf783108f99c4" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "project_skills" ADD CONSTRAINT "FK_a60e9e349e2e6cbe2cf73b1fbda" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(): Promise<void> {
        // El modelo v1 tenía la PK de collaborators en userId y columnas NOT NULL sin
        // equivalente en v2.0: revertir con datos no es posible sin perderlos. Restaurar
        // desde un respaldo de la base de datos en lugar de ejecutar migration:revert.
        throw new Error(
            'Migración irreversible (modelo v2.0): restaura la base de datos desde un respaldo.',
        );
    }

}
