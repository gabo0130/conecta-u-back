import { MigrationInterface, QueryRunner } from "typeorm";

// Tesis (PGCS01, D1): necesidades institucionales en lenguaje natural. Tabla nueva; no toca
// datos existentes. `projectId` enlaza la oportunidad (proyecto) en que se convirtió: única y
// SET NULL si el proyecto se borra. La necesidad es del formulador: se borra con su usuario.
export class CreateNeeds1791400000000 implements MigrationInterface {
    name = 'CreateNeeds1791400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."need_kind" AS ENUM('ACADEMICA', 'ADMINISTRATIVA', 'INVESTIGATIVA', 'TECNOLOGICA', 'BIENESTAR', 'INFRAESTRUCTURA', 'INNOVACION')`);
        await queryRunner.query(`CREATE TYPE "public"."need_status" AS ENUM('REGISTRADA', 'CARACTERIZADA', 'CONVERTIDA', 'DESCARTADA')`);
        await queryRunner.query(`CREATE TABLE "needs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(160) NOT NULL, "description" text NOT NULL, "kind" "public"."need_kind" NOT NULL, "status" "public"."need_status" NOT NULL DEFAULT 'REGISTRADA', "urgency" smallint NOT NULL, "impact" smallint NOT NULL, "deadline" date, "dependency" character varying(150), "characterization" jsonb, "characterizedAt" TIMESTAMP WITH TIME ZONE, "completeness" smallint NOT NULL DEFAULT 0, "priorityScore" numeric(5,2) NOT NULL DEFAULT 0, "projectId" uuid, "discardReason" character varying(500), "createdById" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_needs_project" UNIQUE ("projectId"), CONSTRAINT "CHK_needs_urgency" CHECK ("urgency" BETWEEN 1 AND 5), CONSTRAINT "CHK_needs_impact" CHECK ("impact" BETWEEN 1 AND 5), CONSTRAINT "CHK_needs_completeness" CHECK ("completeness" BETWEEN 0 AND 100), CONSTRAINT "CHK_needs_priority" CHECK ("priorityScore" BETWEEN 0 AND 100), CONSTRAINT "PK_needs" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_needs_created_by_created_at" ON "needs" ("createdById", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "needs" ADD CONSTRAINT "FK_needs_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "needs" ADD CONSTRAINT "FK_needs_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "needs"`);
        await queryRunner.query(`DROP TYPE "public"."need_status"`);
        await queryRunner.query(`DROP TYPE "public"."need_kind"`);
    }
}
