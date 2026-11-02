import { MigrationInterface, QueryRunner } from 'typeorm';

// Alcance v2.2, E8 (RF4, Iteración 3): certificado que soporta la experiencia laboral, de
// práctica y de docencia. Un archivo por experiencia, guardado en la base con acceso
// restringido (RT16). No toca datos existentes: las experiencias anteriores quedan sin
// certificado y el perfil muestra que está pendiente.
export class AddExperienceCertificates1791200000000 implements MigrationInterface {
  name = 'AddExperienceCertificates1791200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."certificate_mime_type" AS ENUM('application/pdf', 'image/png', 'image/jpeg')`,
    );
    await queryRunner.query(
      `CREATE TABLE "experience_certificates" ("experienceId" uuid NOT NULL, "fileName" character varying(160) NOT NULL, "mimeType" "public"."certificate_mime_type" NOT NULL, "sizeBytes" integer NOT NULL, "content" bytea NOT NULL, "uploadedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_experience_certificates" PRIMARY KEY ("experienceId"), CONSTRAINT "CHK_experience_certificates_size" CHECK ("sizeBytes" > 0 AND "sizeBytes" <= 2097152))`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_certificates" ADD CONSTRAINT "FK_experience_certificates_experience" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "experience_certificates"`);
    await queryRunner.query(`DROP TYPE "public"."certificate_mime_type"`);
  }
}
