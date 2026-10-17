import { MigrationInterface, QueryRunner } from "typeorm";

// Guarda qué modelo generó cada embedding: vectores de modelos distintos no se comparan.
// Solo agrega columnas. Los vectores existentes quedan con modelo NULL, que cuenta como
// "otro modelo": se ignoran en el matchmaking y se regeneran solos con el modelo actual.
export class AddEmbeddingModel1790900000000 implements MigrationInterface {
    name = 'AddEmbeddingModel1790900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "embeddingModel" character varying(80)`);
        await queryRunner.query(`ALTER TABLE "required_profiles" ADD "embeddingModel" character varying(80)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "required_profiles" DROP COLUMN "embeddingModel"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "embeddingModel"`);
    }
}
