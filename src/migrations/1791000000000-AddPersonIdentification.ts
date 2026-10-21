import { MigrationInterface, QueryRunner } from "typeorm";

// Alcance v2.1 (ajustes de la cliente, 19/10/2026).
// A1–A4: identificación y contacto de cada persona. Columnas NULL porque ya hay personas sin
// estos datos; los DTO las exigen al crear. El documento (tipo + número) no se repite: índice
// único parcial, la PK uuid no cambia.
// A5: quién registró el proyecto (el líder o el ADMIN a su nombre). NULL en los anteriores.
export class AddPersonIdentification1791000000000 implements MigrationInterface {
    name = 'AddPersonIdentification1791000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "documentType" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "documentNumber" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "nationality" character varying(60)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "alternateEmail" character varying(254)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "institutionalCode" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "CHK_collaborators_document_type" CHECK ("documentType" IS NULL OR "documentType" IN ('CC', 'TI', 'CE', 'PPT', 'PA'))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_collaborators_document" ON "collaborators" ("documentType", "documentNumber") WHERE "documentNumber" IS NOT NULL`);

        await queryRunner.query(`ALTER TABLE "projects" ADD "createdById" uuid`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_createdById" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_createdById"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "createdById"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_collaborators_document"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP CONSTRAINT "CHK_collaborators_document_type"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "institutionalCode"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "alternateEmail"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "nationality"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "documentNumber"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "documentType"`);
    }
}
