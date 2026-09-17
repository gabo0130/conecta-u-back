import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1789663140903 implements MigrationInterface {
    name = 'Init1789663140903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "experiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "collaboratorId" uuid NOT NULL, "title" character varying(140) NOT NULL, "organization" character varying(140), "period" character varying(60), "description" text, CONSTRAINT "PK_884f0913a63882712ea578e7c85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."skills_type_enum" AS ENUM('CONOCIMIENTO', 'COMPETENCIA')`);
        await queryRunner.query(`CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "collaboratorId" uuid NOT NULL, "name" character varying(80) NOT NULL, "type" "public"."skills_type_enum" NOT NULL DEFAULT 'CONOCIMIENTO', "level" character varying(20), CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('LIDER', 'COLABORADOR', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying(120) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'COLABORADOR', "program" character varying(120), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."collaborators_availabilitystatus_enum" AS ENUM('DISPONIBLE', 'PARCIAL', 'NO_DISPONIBLE')`);
        await queryRunner.query(`CREATE TABLE "collaborators" ("userId" uuid NOT NULL, "headline" character varying(160), "availabilityStatus" "public"."collaborators_availabilitystatus_enum" NOT NULL DEFAULT 'DISPONIBLE', "weeklyHours" character varying(40), "modality" character varying(60), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e5b82c5ada6a6557ec22f219b30" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('BORRADOR', 'EN_ANALISIS', 'ANALIZADO')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(160) NOT NULL, "summary" text NOT NULL, "objectives" text NOT NULL, "knownSkills" text, "semillero" character varying(120), "program" character varying(120), "leaderId" uuid NOT NULL, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'BORRADOR', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD CONSTRAINT "FK_0b2edf89c2ce5a23ea09f37f222" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("userId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skills" ADD CONSTRAINT "FK_80dfdf58503c0398fec3f49ba59" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("userId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "FK_e5b82c5ada6a6557ec22f219b30" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_bfdf9487c48efc8a0381be2e5e9" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_bfdf9487c48efc8a0381be2e5e9"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP CONSTRAINT "FK_e5b82c5ada6a6557ec22f219b30"`);
        await queryRunner.query(`ALTER TABLE "skills" DROP CONSTRAINT "FK_80dfdf58503c0398fec3f49ba59"`);
        await queryRunner.query(`ALTER TABLE "experiences" DROP CONSTRAINT "FK_0b2edf89c2ce5a23ea09f37f222"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(`DROP TABLE "collaborators"`);
        await queryRunner.query(`DROP TYPE "public"."collaborators_availabilitystatus_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "skills"`);
        await queryRunner.query(`DROP TYPE "public"."skills_type_enum"`);
        await queryRunner.query(`DROP TABLE "experiences"`);
    }

}
