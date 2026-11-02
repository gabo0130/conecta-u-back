import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorSkillOrmEntity } from '../infrastructure/database/typeorm/collaborator-skill.orm-entity';
import { CollaboratorOrmEntity } from '../infrastructure/database/typeorm/collaborator.orm-entity';
import { DeliverableOrmEntity } from '../infrastructure/database/typeorm/deliverable.orm-entity';
import { ExperienceCertificateOrmEntity } from '../infrastructure/database/typeorm/experience-certificate.orm-entity';
import { TypeOrmExperienceCertificateRepository } from '../infrastructure/database/typeorm/typeorm-experience-certificate.repository';
import { RecommendationFeedbackOrmEntity } from '../infrastructure/database/typeorm/recommendation-feedback.orm-entity';
import { TypeOrmRecommendationFeedbackRepository } from '../infrastructure/database/typeorm/typeorm-recommendation-feedback.repository';
import { NeedOrmEntity } from '../infrastructure/database/typeorm/need.orm-entity';
import { TypeOrmNeedRepository } from '../infrastructure/database/typeorm/typeorm-need.repository';
import { InvitationOrmEntity } from '../infrastructure/database/typeorm/invitation.orm-entity';
import { TypeOrmInvitationRepository } from '../infrastructure/database/typeorm/typeorm-invitation.repository';
import { ExperienceOrmEntity } from '../infrastructure/database/typeorm/experience.orm-entity';
import { ImportRunOrmEntity } from '../infrastructure/database/typeorm/import-run.orm-entity';
import { ProjectAnalysisOrmEntity } from '../infrastructure/database/typeorm/project-analysis.orm-entity';
import { ProgramOrmEntity } from '../infrastructure/database/typeorm/program.orm-entity';
import { ProjectCategoryOrmEntity } from '../infrastructure/database/typeorm/project-category.orm-entity';
import { ProjectTypeOrmEntity } from '../infrastructure/database/typeorm/project-type.orm-entity';
import { ProjectOrmEntity } from '../infrastructure/database/typeorm/project.orm-entity';
import { RecommendationOrmEntity } from '../infrastructure/database/typeorm/recommendation.orm-entity';
import { RequiredProfileSkillOrmEntity } from '../infrastructure/database/typeorm/required-profile-skill.orm-entity';
import { RequiredProfileOrmEntity } from '../infrastructure/database/typeorm/required-profile.orm-entity';
import { SkillOrmEntity } from '../infrastructure/database/typeorm/skill.orm-entity';
import { TypeOrmCollaboratorEmbeddingRepository } from '../infrastructure/database/typeorm/typeorm-collaborator-embedding.repository';
import { TypeOrmCollaboratorSkillRepository } from '../infrastructure/database/typeorm/typeorm-collaborator-skill.repository';
import { TypeOrmCollaboratorRepository } from '../infrastructure/database/typeorm/typeorm-collaborator.repository';
import { TypeOrmExperienceRepository } from '../infrastructure/database/typeorm/typeorm-experience.repository';
import { TypeOrmImportRunRepository } from '../infrastructure/database/typeorm/typeorm-import-run.repository';
import { TypeOrmProjectAnalysisRepository } from '../infrastructure/database/typeorm/typeorm-project-analysis.repository';
import { TypeOrmProgramRepository } from '../infrastructure/database/typeorm/typeorm-program.repository';
import { TypeOrmProjectCategoryRepository } from '../infrastructure/database/typeorm/typeorm-project-category.repository';
import { TypeOrmProjectTypeRepository } from '../infrastructure/database/typeorm/typeorm-project-type.repository';
import { TypeOrmProjectRepository } from '../infrastructure/database/typeorm/typeorm-project.repository';
import { TypeOrmRecommendationRepository } from '../infrastructure/database/typeorm/typeorm-recommendation.repository';
import { TypeOrmRequiredProfileRepository } from '../infrastructure/database/typeorm/typeorm-required-profile.repository';
import { TypeOrmSkillRepository } from '../infrastructure/database/typeorm/typeorm-skill.repository';
import { TypeOrmUnitOfWork } from '../infrastructure/database/typeorm/typeorm-unit-of-work';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import {
  COLLABORATOR_EMBEDDING_REPOSITORY,
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
  EXPERIENCE_CERTIFICATE_REPOSITORY,
  EXPERIENCE_REPOSITORY,
  IMPORT_RUN_REPOSITORY,
  INVITATION_REPOSITORY,
  NEED_REPOSITORY,
  RECOMMENDATION_FEEDBACK_REPOSITORY,
  PROGRAM_REPOSITORY,
  PROJECT_ANALYSIS_REPOSITORY,
  PROJECT_CATEGORY_REPOSITORY,
  PROJECT_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  RECOMMENDATION_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
  SKILL_REPOSITORY,
  UNIT_OF_WORK,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';

const REPOSITORY_BINDINGS = [
  { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
  { provide: PROGRAM_REPOSITORY, useClass: TypeOrmProgramRepository },
  { provide: SKILL_REPOSITORY, useClass: TypeOrmSkillRepository },
  { provide: COLLABORATOR_REPOSITORY, useClass: TypeOrmCollaboratorRepository },
  {
    provide: COLLABORATOR_SKILL_REPOSITORY,
    useClass: TypeOrmCollaboratorSkillRepository,
  },
  { provide: EXPERIENCE_REPOSITORY, useClass: TypeOrmExperienceRepository },
  {
    provide: EXPERIENCE_CERTIFICATE_REPOSITORY,
    useClass: TypeOrmExperienceCertificateRepository,
  },
  { provide: PROJECT_REPOSITORY, useClass: TypeOrmProjectRepository },
  { provide: PROJECT_TYPE_REPOSITORY, useClass: TypeOrmProjectTypeRepository },
  {
    provide: PROJECT_CATEGORY_REPOSITORY,
    useClass: TypeOrmProjectCategoryRepository,
  },
  { provide: IMPORT_RUN_REPOSITORY, useClass: TypeOrmImportRunRepository },
  {
    provide: PROJECT_ANALYSIS_REPOSITORY,
    useClass: TypeOrmProjectAnalysisRepository,
  },
  {
    provide: REQUIRED_PROFILE_REPOSITORY,
    useClass: TypeOrmRequiredProfileRepository,
  },
  {
    provide: COLLABORATOR_EMBEDDING_REPOSITORY,
    useClass: TypeOrmCollaboratorEmbeddingRepository,
  },
  {
    provide: RECOMMENDATION_REPOSITORY,
    useClass: TypeOrmRecommendationRepository,
  },
  { provide: INVITATION_REPOSITORY, useClass: TypeOrmInvitationRepository },
  { provide: NEED_REPOSITORY, useClass: TypeOrmNeedRepository },
  {
    provide: RECOMMENDATION_FEEDBACK_REPOSITORY,
    useClass: TypeOrmRecommendationFeedbackRepository,
  },
  { provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork },
];

/** Registra una sola vez las entidades ORM y enlaza cada puerto del dominio con su adaptador TypeORM. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ProgramOrmEntity,
      SkillOrmEntity,
      CollaboratorOrmEntity,
      CollaboratorSkillOrmEntity,
      ExperienceOrmEntity,
      ExperienceCertificateOrmEntity,
      ProjectTypeOrmEntity,
      ProjectCategoryOrmEntity,
      ProjectOrmEntity,
      DeliverableOrmEntity,
      ImportRunOrmEntity,
      ProjectAnalysisOrmEntity,
      RequiredProfileOrmEntity,
      RequiredProfileSkillOrmEntity,
      RecommendationOrmEntity,
      InvitationOrmEntity,
      NeedOrmEntity,
      RecommendationFeedbackOrmEntity,
    ]),
  ],
  providers: REPOSITORY_BINDINGS,
  exports: REPOSITORY_BINDINGS.map((binding) => binding.provide),
})
export class PersistenceModule {}
