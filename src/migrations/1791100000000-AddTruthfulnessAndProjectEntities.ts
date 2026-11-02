import { MigrationInterface, QueryRunner } from "typeorm";

// Alcance v2.2 (ajustes de la docente, 01/11/2026).
// E2: declaración de veracidad (buena fe, art. 83 C.P.), con su fecha como evidencia. Las
// personas anteriores quedan en false: la aceptan al volver a guardar «Mi perfil».
// E5: entidad ejecutora, entidad patrocinadora y duración del proyecto. NULL en los anteriores;
// el DTO exige ejecutora y duración al crear.
export class AddTruthfulnessAndProjectEntities1791100000000 implements MigrationInterface {
    name = 'AddTruthfulnessAndProjectEntities1791100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "truthfulnessDeclared" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "truthfulnessDeclaredAt" TIMESTAMP WITH TIME ZONE`);

        await queryRunner.query(`ALTER TABLE "projects" ADD "executingEntity" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "sponsorEntity" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "durationMonths" smallint`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "CHK_projects_duration_months" CHECK ("durationMonths" IS NULL OR "durationMonths" BETWEEN 1 AND 60)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "CHK_projects_duration_months"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "durationMonths"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "sponsorEntity"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "executingEntity"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "truthfulnessDeclaredAt"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "truthfulnessDeclared"`);
    }
}
