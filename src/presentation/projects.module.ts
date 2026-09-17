import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { CreateProjectUseCase } from '../application/use-cases/create-project.use-case';
import { GetProjectByIdUseCase } from '../application/use-cases/get-project-by-id.use-case';
import { ListMyProjectsUseCase } from '../application/use-cases/list-my-projects.use-case';
import { UpdateProjectUseCase } from '../application/use-cases/update-project.use-case';
import { ProjectOrmEntity } from '../infrastructure/database/typeorm/project.orm-entity';
import { TypeOrmProjectRepository } from '../infrastructure/database/typeorm/typeorm-project.repository';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import { BcryptPasswordHasherService } from '../infrastructure/security/bcrypt-password-hasher.service';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import {
  PASSWORD_HASHER,
  PROJECT_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';
import { ProjectsController } from './controllers/projects.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, ProjectOrmEntity]),
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
  controllers: [ProjectsController],
  providers: [
    CreateProjectUseCase,
    ListMyProjectsUseCase,
    GetProjectByIdUseCase,
    UpdateProjectUseCase,
    JwtAuthGuard,
    AuthorizationGuard,
    TypeOrmUserRepository,
    TypeOrmProjectRepository,
    BcryptPasswordHasherService,
    JwtTokenService,
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: PROJECT_REPOSITORY,
      useExisting: TypeOrmProjectRepository,
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
export class ProjectsModule {}
