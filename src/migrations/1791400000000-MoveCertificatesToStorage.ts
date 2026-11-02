import { MigrationInterface, QueryRunner } from 'typeorm';

// RT16 (Iteración 3): el archivo del certificado pasa a un bucket privado y en la base quedan
// sus metadatos (`storageKey`). Expande sin perder datos: `content` se vuelve opcional para los
// certificados ya subidos, que se mueven con `npm run storage:migrate-certificates`. Cada fila
// debe tener su archivo en un lado o en el otro.
export class MoveCertificatesToStorage1791400000000 implements MigrationInterface {
  name = 'MoveCertificatesToStorage1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "experience_certificates" ADD "storageKey" character varying(300)`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_certificates" ALTER COLUMN "content" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_certificates" ADD CONSTRAINT "CHK_experience_certificates_file" CHECK ("storageKey" IS NOT NULL OR "content" IS NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Volver atrás solo es posible si ningún certificado depende del bucket.
    await queryRunner.query(
      `ALTER TABLE "experience_certificates" DROP CONSTRAINT "CHK_experience_certificates_file"`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_certificates" ALTER COLUMN "content" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "experience_certificates" DROP COLUMN "storageKey"`,
    );
  }
}
