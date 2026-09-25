import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { AddMyCollaboratorSkillUseCase } from '../application/use-cases/add-my-collaborator-skill.use-case';
import { CreateMyCollaboratorProfileUseCase } from '../application/use-cases/create-my-collaborator-profile.use-case';
import { CreateMyExperienceUseCase } from '../application/use-cases/create-my-experience.use-case';
import { DeleteMyCollaboratorSkillUseCase } from '../application/use-cases/delete-my-collaborator-skill.use-case';
import { DeleteMyExperienceUseCase } from '../application/use-cases/delete-my-experience.use-case';
import { GetMyCollaboratorProfileUseCase } from '../application/use-cases/get-my-collaborator-profile.use-case';
import { ListMyCollaboratorSkillsUseCase } from '../application/use-cases/list-my-collaborator-skills.use-case';
import { UpdateMyAvailabilityUseCase } from '../application/use-cases/update-my-availability.use-case';
import { UpdateMyCollaboratorProfileUseCase } from '../application/use-cases/update-my-collaborator-profile.use-case';
import { UpdateMyCollaboratorSkillUseCase } from '../application/use-cases/update-my-collaborator-skill.use-case';
import { UpdateMyExperienceUseCase } from '../application/use-cases/update-my-experience.use-case';
import { CollaboratorOrmEntity } from '../infrastructure/database/typeorm/collaborator.orm-entity';
import { CollaboratorSkillOrmEntity } from '../infrastructure/database/typeorm/collaborator-skill.orm-entity';
import { ExperienceOrmEntity } from '../infrastructure/database/typeorm/experience.orm-entity';
import { ProgramOrmEntity } from '../infrastructure/database/typeorm/program.orm-entity';
import { SkillOrmEntity } from '../infrastructure/database/typeorm/skill.orm-entity';
import { TypeOrmCollaboratorRepository } from '../infrastructure/database/typeorm/typeorm-collaborator.repository';
import { TypeOrmCollaboratorSkillRepository } from '../infrastructure/database/typeorm/typeorm-collaborator-skill.repository';
import { TypeOrmExperienceRepository } from '../infrastructure/database/typeorm/typeorm-experience.repository';
import { TypeOrmSkillRepository } from '../infrastructure/database/typeorm/typeorm-skill.repository';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import { BcryptPasswordHasherService } from '../infrastructure/security/bcrypt-password-hasher.service';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
  EXPERIENCE_REPOSITORY,
  PASSWORD_HASHER,
  SKILL_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';
import { CollaboratorsController } from './controllers/collaborators.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ProgramOrmEntity,
      CollaboratorOrmEntity,
      SkillOrmEntity,
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
  controllers: [CollaboratorsController],
  providers: [
    CreateMyCollaboratorProfileUseCase,
    GetMyCollaboratorProfileUseCase,
    UpdateMyCollaboratorProfileUseCase,
    ListMyCollaboratorSkillsUseCase,
    AddMyCollaboratorSkillUseCase,
    UpdateMyCollaboratorSkillUseCase,
    DeleteMyCollaboratorSkillUseCase,
    CreateMyExperienceUseCase,
    UpdateMyExperienceUseCase,
    DeleteMyExperienceUseCase,
    UpdateMyAvailabilityUseCase,
    JwtAuthGuard,
    AuthorizationGuard,
    TypeOrmUserRepository,
    TypeOrmCollaboratorRepository,
    TypeOrmSkillRepository,
    TypeOrmCollaboratorSkillRepository,
    TypeOrmExperienceRepository,
    BcryptPasswordHasherService,
    JwtTokenService,
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: COLLABORATOR_REPOSITORY,
      useExisting: TypeOrmCollaboratorRepository,
    },
    {
      provide: SKILL_REPOSITORY,
      useExisting: TypeOrmSkillRepository,
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
      provide: PASSWORD_HASHER,
      useExisting: BcryptPasswordHasherService,
    },
    {
      provide: TOKEN_SERVICE,
      useExisting: JwtTokenService,
    },
  ],
})
export class CollaboratorsModule {}
