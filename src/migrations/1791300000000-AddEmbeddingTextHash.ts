import { MigrationInterface, QueryRunner } from "typeorm";

// Huella (sha256) del texto con que se calculó el embedding de cada persona: si el texto no
// cambió desde entonces, el vector se reutiliza sin llamar a la API. Solo agrega una columna
// nula; los embeddings existentes se recalculan una vez y desde ahí guardan su huella.
export class AddEmbeddingTextHash1791300000000 implements MigrationInterface {
    name = 'AddEmbeddingTextHash1791300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "embeddingTextHash" character varying(64)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "embeddingTextHash"`);
    }
}
