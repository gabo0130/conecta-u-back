import { MigrationInterface, QueryRunner } from 'typeorm';

// Recuperación de contraseña: tokens de un solo uso (solo su hash) y la fecha del último cambio
// de contraseña, que revoca las sesiones emitidas antes. No toca datos existentes.
export class AddPasswordReset1791500000000 implements MigrationInterface {
  name = 'AddPasswordReset1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordChangedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_password_reset_tokens_hash" ON "password_reset_tokens" ("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_created" ON "password_reset_tokens" ("userId", "createdAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordChangedAt"`,
    );
  }
}
