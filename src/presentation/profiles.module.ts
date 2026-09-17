import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { CreateExperienceUseCase } from '../application/use-cases/create-experience.use-case';
import { CreateSkillUseCase } from '../application/use-cases/create-skill.use-case';
import { DeleteExperienceUseCase } from '../application/use-cases/delete-experience.use-case';
import { DeleteSkillUseCase } from '../application/use-cases/delete-skill.use-case';
import { GetMyProfileUseCase } from '../application/use-cases/get-my-profile.use-case';
import { ListMySkillsUseCase } from '../application/use-cases/list-my-skills.use-case';
import { UpdateAvailabilityUseCase } from '../application/use-cases/update-availability.use-case';
import { UpdateExperienceUseCase } from '../application/use-cases/update-experience.use-case';
import { UpdateMyProfileUseCase } from '../application/use-cases/update-my-profile.use-case';
import { UpdateSkillUseCase } from '../application/use-cases/update-skill.use-case';
import { CollaboratorOrmEntity } from '../infrastructure/database/typeorm/collaborator.orm-entity';
import { ExperienceOrmEntity } from '../infrastructure/database/typeorm/experience.orm-entity';
import { SkillOrmEntity } from '../infrastructure/database/typeorm/skill.orm-entity';
import { TypeOrmCollaboratorRepository } from '../infrastructure/database/typeorm/typeorm-collaborator.repository';
import { TypeOrmExperienceRepository } from '../infrastructure/database/typeorm/typeorm-experience.repository';
import { TypeOrmSkillRepository } from '../infrastructure/database/typeorm/typeorm-skill.repository';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import { BcryptPasswordHasherService } from '../infrastructure/security/bcrypt-password-hasher.service';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import {
  COLLABORATOR_REPOSITORY,
  EXPERIENCE_REPOSITORY,
  PASSWORD_HASHER,
  SKILL_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';
import { ProfilesController } from './controllers/profiles.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      CollaboratorOrmEntity,
      SkillOrmEntity,
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
  controllers: [ProfilesController],
  providers: [
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    ListMySkillsUseCase,
    CreateSkillUseCase,
    UpdateSkillUseCase,
    DeleteSkillUseCase,
    CreateExperienceUseCase,
    UpdateExperienceUseCase,
    DeleteExperienceUseCase,
    UpdateAvailabilityUseCase,
    JwtAuthGuard,
    AuthorizationGuard,
    TypeOrmUserRepository,
    TypeOrmCollaboratorRepository,
    TypeOrmSkillRepository,
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
export class ProfilesModule {}
