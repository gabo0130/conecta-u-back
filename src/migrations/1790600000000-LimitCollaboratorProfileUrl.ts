import { MigrationInterface, QueryRunner } from "typeorm";

// El enlace del perfil pasa de varchar sin límite a varchar(300), igual que PROFILE_URL_MAX_LENGTH.
export class LimitCollaboratorProfileUrl1790600000000 implements MigrationInterface {
    name = 'LimitCollaboratorProfileUrl1790600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" ALTER COLUMN "profileUrl" TYPE character varying(300)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" ALTER COLUMN "profileUrl" TYPE character varying`);
    }
}
