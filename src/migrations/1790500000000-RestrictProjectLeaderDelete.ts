import { MigrationInterface, QueryRunner } from "typeorm";

// Borrar un usuario ya no elimina en cascada los proyectos que lidera.
export class RestrictProjectLeaderDelete1790500000000 implements MigrationInterface {
    name = 'RestrictProjectLeaderDelete1790500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_bfdf9487c48efc8a0381be2e5e9"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_bfdf9487c48efc8a0381be2e5e9" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_bfdf9487c48efc8a0381be2e5e9"`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_bfdf9487c48efc8a0381be2e5e9" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
