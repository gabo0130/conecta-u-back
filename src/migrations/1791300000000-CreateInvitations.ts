import { MigrationInterface, QueryRunner } from "typeorm";

// RF21–RF22 (HU-18, Iteración 3): historial de convocatorias por correo. Tabla nueva; no toca
// datos existentes. El correo del destinatario se guarda para auditoría del ADMIN; al líder
// solo se le muestra enmascarado.
export class CreateInvitations1791300000000 implements MigrationInterface {
    name = 'CreateInvitations1791300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."invitation_status" AS ENUM('ENVIADA', 'FALLIDA')`);
        await queryRunner.query(`CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "collaboratorId" uuid, "requiredProfileId" uuid, "sentById" uuid NOT NULL, "recipientName" character varying(200) NOT NULL, "recipientEmail" character varying(254) NOT NULL, "profileName" character varying(120), "status" "public"."invitation_status" NOT NULL, "errorMessage" character varying(300), "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_invitations" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_invitations_project_sent" ON "invitations" ("projectId", "sentAt") `);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_collaborator" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_required_profile" FOREIGN KEY ("requiredProfileId") REFERENCES "required_profiles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "invitations"`);
        await queryRunner.query(`DROP TYPE "public"."invitation_status"`);
    }
}
