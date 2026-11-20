import { MigrationInterface, QueryRunner } from "typeorm";

// Guarda cada llamada real a los modelos de un análisis (proveedor, modelo, resultado, tiempo y
// tokens) para conocer el consumo real (RT7, RT12), también de los intentos que fallaron.
// Solo agrega una columna nula: los análisis anteriores quedan sin detalle.
export class AddAnalysisAttempts1791200000000 implements MigrationInterface {
    name = 'AddAnalysisAttempts1791200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_analyses" ADD "attempts" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_analyses" DROP COLUMN "attempts"`);
    }
}
