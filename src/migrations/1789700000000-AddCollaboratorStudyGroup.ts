import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollaboratorStudyGroup1789700000000
  implements MigrationInterface
{
  name = 'AddCollaboratorStudyGroup1789700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD COLUMN IF NOT EXISTS "studyGroup" character varying(120)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP COLUMN IF EXISTS "studyGroup"`,
    );
  }
}
