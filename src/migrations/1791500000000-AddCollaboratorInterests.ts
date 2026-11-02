import { MigrationInterface, QueryRunner } from "typeorm";

// Tesis (PGCS01, D5): intereses del perfil. Columna nueva con default '{}': las personas
// existentes quedan sin intereses y su embedding no cambia hasta que los registren.
export class AddCollaboratorInterests1791500000000 implements MigrationInterface {
    name = 'AddCollaboratorInterests1791500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "interests" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "CHK_collaborators_interests_max" CHECK (cardinality("interests") <= 10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" DROP CONSTRAINT "CHK_collaborators_interests_max"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "interests"`);
    }
}
