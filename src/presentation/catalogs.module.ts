import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { ListProgramsUseCase } from '../application/use-cases/list-programs.use-case';
import { ListProjectCategoriesUseCase } from '../application/use-cases/list-project-categories.use-case';
import { ListProjectTypesUseCase } from '../application/use-cases/list-project-types.use-case';
import { ProposeSkillUseCase } from '../application/use-cases/propose-skill.use-case';
import { SearchSkillsUseCase } from '../application/use-cases/search-skills.use-case';
import { ProgramOrmEntity } from '../infrastructure/database/typeorm/program.orm-entity';
import { ProjectCategoryOrmEntity } from '../infrastructure/database/typeorm/project-category.orm-entity';
import { ProjectTypeOrmEntity } from '../infrastructure/database/typeorm/project-type.orm-entity';
import { SkillOrmEntity } from '../infrastructure/database/typeorm/skill.orm-entity';
import { TypeOrmProgramRepository } from '../infrastructure/database/typeorm/typeorm-program.repository';
import { TypeOrmProjectCategoryRepository } from '../infrastructure/database/typeorm/typeorm-project-category.repository';
import { TypeOrmProjectTypeRepository } from '../infrastructure/database/typeorm/typeorm-project-type.repository';
import { TypeOrmSkillRepository } from '../infrastructure/database/typeorm/typeorm-skill.repository';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import {
  PROGRAM_REPOSITORY,
  PROJECT_CATEGORY_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  SKILL_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';
import { CatalogsController } from './controllers/catalogs.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ProgramOrmEntity,
      SkillOrmEntity,
      ProjectTypeOrmEntity,
      ProjectCategoryOrmEntity,
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
  controllers: [CatalogsController],
  providers: [
    ListProgramsUseCase,
    SearchSkillsUseCase,
    ProposeSkillUseCase,
    ListProjectTypesUseCase,
    ListProjectCategoriesUseCase,
    JwtAuthGuard,
    AuthorizationGuard,
    TypeOrmUserRepository,
    TypeOrmProgramRepository,
    TypeOrmSkillRepository,
    TypeOrmProjectTypeRepository,
    TypeOrmProjectCategoryRepository,
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
      provide: PROJECT_TYPE_REPOSITORY,
      useExisting: TypeOrmProjectTypeRepository,
    },
    {
      provide: PROJECT_CATEGORY_REPOSITORY,
      useExisting: TypeOrmProjectCategoryRepository,
    },
    {
      provide: TOKEN_SERVICE,
      useExisting: JwtTokenService,
    },
  ],
})
export class CatalogsModule {}
