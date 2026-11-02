import { MigrationInterface, QueryRunner } from "typeorm";

// Tesis (PGCS01, D6): aceptar o descartar a una persona recomendada. Una fila por (perfil,
// persona) con el puesto y el puntaje del momento: no depende de `recommendations`, que se
// reemplaza al regenerar. Tabla nueva; no toca datos existentes.
export class CreateRecommendationFeedback1791600000000 implements MigrationInterface {
    name = 'CreateRecommendationFeedback1791600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."feedback_decision" AS ENUM('ACEPTADA', 'DESCARTADA')`);
        await queryRunner.query(`CREATE TABLE "recommendation_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "requiredProfileId" uuid NOT NULL, "collaboratorId" uuid NOT NULL, "decision" "public"."feedback_decision" NOT NULL, "reason" character varying(500), "rankAtDecision" integer NOT NULL, "scoreAtDecision" numeric(5,2) NOT NULL, "decidedById" uuid NOT NULL, "decidedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_recommendation_feedback_profile_collaborator" UNIQUE ("requiredProfileId", "collaboratorId"), CONSTRAINT "PK_recommendation_feedback" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_recommendation_feedback_project" ON "recommendation_feedback" ("projectId") `);
        await queryRunner.query(`ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "FK_recommendation_feedback_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "FK_recommendation_feedback_profile" FOREIGN KEY ("requiredProfileId") REFERENCES "required_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "FK_recommendation_feedback_collaborator" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "recommendation_feedback"`);
        await queryRunner.query(`DROP TYPE "public"."feedback_decision"`);
    }
}
