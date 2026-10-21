import { MigrationInterface, QueryRunner } from "typeorm";

// Iteración 2 (RF12–RF17): análisis de proyectos con IA, perfiles requeridos y recomendaciones.
// Usa pgvector para el matchmaking semántico (dimensión 768). Solo agrega: no toca filas existentes.
export class AddAnalysisAndMatchmaking1790800000000 implements MigrationInterface {
    name = 'AddAnalysisAndMatchmaking1790800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        await queryRunner.query(`CREATE TABLE "project_analyses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "requestedById" uuid, "status" character varying(20) NOT NULL, "provider" character varying(20) NOT NULL, "model" character varying(60) NOT NULL, "promptVersion" character varying(20) NOT NULL, "input" jsonb NOT NULL, "inputTokens" integer, "outputTokens" integer, "rawOutput" jsonb, "summary" text, "errorMessage" text, "durationMs" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_project_analyses_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_project_analyses_project_createdAt" ON "project_analyses" ("projectId", "createdAt")`);
        await queryRunner.query(`ALTER TABLE "project_analyses" ADD CONSTRAINT "FK_project_analyses_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_analyses" ADD CONSTRAINT "FK_project_analyses_requestedBy" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE "required_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "analysisId" uuid, "source" character varying(10) NOT NULL, "name" character varying(120) NOT NULL, "description" text NOT NULL, "justification" text NOT NULL, "quantity" integer NOT NULL, "priority" character varying(10) NOT NULL, "minWeeklyHours" integer, "position" integer NOT NULL, "embedding" vector(768), "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_required_profiles_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_required_profiles_project" ON "required_profiles" ("projectId")`);
        await queryRunner.query(`ALTER TABLE "required_profiles" ADD CONSTRAINT "FK_required_profiles_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "required_profiles" ADD CONSTRAINT "FK_required_profiles_analysis" FOREIGN KEY ("analysisId") REFERENCES "project_analyses"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE "required_profile_skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requiredProfileId" uuid NOT NULL, "skillId" uuid, "rawName" character varying(80) NOT NULL, "type" character varying(20) NOT NULL, "minLevel" character varying(12) NOT NULL, "importance" character varying(10) NOT NULL, CONSTRAINT "PK_required_profile_skills_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_required_profile_skills_profile" ON "required_profile_skills" ("requiredProfileId")`);
        await queryRunner.query(`ALTER TABLE "required_profile_skills" ADD CONSTRAINT "FK_required_profile_skills_profile" FOREIGN KEY ("requiredProfileId") REFERENCES "required_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "required_profile_skills" ADD CONSTRAINT "FK_required_profile_skills_skill" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE "recommendations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requiredProfileId" uuid NOT NULL, "collaboratorId" uuid NOT NULL, "rank" integer NOT NULL, "score" numeric(5,2) NOT NULL, "skillScore" numeric(5,4) NOT NULL, "semanticScore" numeric(5,4) NOT NULL, "experienceScore" numeric(5,4) NOT NULL, "availabilityScore" numeric(5,4) NOT NULL, "breakdown" jsonb NOT NULL, "generatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_recommendations_profile_collaborator" UNIQUE ("requiredProfileId", "collaboratorId"), CONSTRAINT "PK_recommendations_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "recommendations" ADD CONSTRAINT "FK_recommendations_profile" FOREIGN KEY ("requiredProfileId") REFERENCES "required_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recommendations" ADD CONSTRAINT "FK_recommendations_collaborator" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "collaborators" ADD "profileEmbedding" vector(768)`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "embeddingUpdatedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "embeddingUpdatedAt"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "profileEmbedding"`);
        await queryRunner.query(`DROP TABLE "recommendations"`);
        await queryRunner.query(`DROP TABLE "required_profile_skills"`);
        await queryRunner.query(`DROP TABLE "required_profiles"`);
        await queryRunner.query(`DROP TABLE "project_analyses"`);
        // La extensión `vector` se deja instalada: otras tablas futuras pueden usarla.
    }
}
