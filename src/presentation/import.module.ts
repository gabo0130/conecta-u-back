import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { GenerateCollaboratorsTemplateUseCase } from '../application/use-cases/generate-collaborators-template.use-case';
import { ImportCollaboratorsUseCase } from '../application/use-cases/import-collaborators.use-case';
import { CollaboratorOrmEntity } from '../infrastructure/database/typeorm/collaborator.orm-entity';
import { CollaboratorSkillOrmEntity } from '../infrastructure/database/typeorm/collaborator-skill.orm-entity';
import { ExperienceOrmEntity } from '../infrastructure/database/typeorm/experience.orm-entity';
import { ProgramOrmEntity } from '../infrastructure/database/typeorm/program.orm-entity';
import { SkillOrmEntity } from '../infrastructure/database/typeorm/skill.orm-entity';
import { TypeOrmCollaboratorRepository } from '../infrastructure/database/typeorm/typeorm-collaborator.repository';
import { TypeOrmCollaboratorSkillRepository } from '../infrastructure/database/typeorm/typeorm-collaborator-skill.repository';
import { TypeOrmExperienceRepository } from '../infrastructure/database/typeorm/typeorm-experience.repository';
import { TypeOrmProgramRepository } from '../infrastructure/database/typeorm/typeorm-program.repository';
import { TypeOrmSkillRepository } from '../infrastructure/database/typeorm/typeorm-skill.repository';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
  EXPERIENCE_REPOSITORY,
  PROGRAM_REPOSITORY,
  SKILL_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';
import { AdminImportController } from './controllers/admin-import.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ProgramOrmEntity,
      SkillOrmEntity,
      CollaboratorOrmEntity,
      CollaboratorSkillOrmEntity,
      ExperienceOrmEntity,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'dev-secret',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ??
            '7d') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AdminImportController],
  providers: [
    GenerateCollaboratorsTemplateUseCase,
    ImportCollaboratorsUseCase,
    JwtAuthGuard,
    AuthorizationGuard,
    TypeOrmUserRepository,
    TypeOrmProgramRepository,
    TypeOrmSkillRepository,
    TypeOrmCollaboratorRepository,
    TypeOrmCollaboratorSkillRepository,
    TypeOrmExperienceRepository,
    JwtTokenService,
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: PROGRAM_REPOSITORY,
      useExisting: TypeOrmProgramRepository,
    },
    {
      provide: SKILL_REPOSITORY,
      useExisting: TypeOrmSkillRepository,
    },
    {
      provide: COLLABORATOR_REPOSITORY,
      useExisting: TypeOrmCollaboratorRepository,
    },
    {
      provide: COLLABORATOR_SKILL_REPOSITORY,
      useExisting: TypeOrmCollaboratorSkillRepository,
    },
    {
      provide: EXPERIENCE_REPOSITORY,
      useExisting: TypeOrmExperienceRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useExisting: JwtTokenService,
    },
  ],
})
export class ImportModule {}
