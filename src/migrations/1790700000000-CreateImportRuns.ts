import { MigrationInterface, QueryRunner } from "typeorm";

// Auditoría de importaciones (historial visible en /importar/historial): tabla nueva, no toca
// columnas ni filas existentes.
export class CreateImportRuns1790700000000 implements MigrationInterface {
    name = 'CreateImportRuns1790700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "import_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileName" character varying(255) NOT NULL, "importedByUserId" uuid, "createdCount" integer NOT NULL, "rejectedCount" integer NOT NULL, "rejected" jsonb NOT NULL DEFAULT '[]', "warnings" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_import_runs_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_import_runs_createdAt" ON "import_runs" ("createdAt")`);
        await queryRunner.query(`ALTER TABLE "import_runs" ADD CONSTRAINT "FK_import_runs_importedByUserId" FOREIGN KEY ("importedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "import_runs" DROP CONSTRAINT "FK_import_runs_importedByUserId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_import_runs_createdAt"`);
        await queryRunner.query(`DROP TABLE "import_runs"`);
    }
}
