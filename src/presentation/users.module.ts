import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserByIdUseCase } from '../application/use-cases/get-user-by-id.use-case';
import { ListRolesUseCase } from '../application/use-cases/list-roles.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { TypeOrmUserRepository } from '../infrastructure/database/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '../infrastructure/database/typeorm/user.orm-entity';
import { BcryptPasswordHasherService } from '../infrastructure/security/bcrypt-password-hasher.service';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import {
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../shared/interfaces/tokens';
import { AccessController } from './controllers/access.controller';
import { UsersController } from './controllers/users.controller';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
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
  controllers: [AccessController, UsersController],
  providers: [
    ListRolesUseCase,
    ListUsersUseCase,
    CreateUserUseCase,
    GetUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    JwtAuthGuard,
    AuthorizationGuard,
    TypeOrmUserRepository,
    BcryptPasswordHasherService,
    JwtTokenService,
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
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
  exports: [JwtAuthGuard, AuthorizationGuard, TOKEN_SERVICE, USER_REPOSITORY],
})
export class UsersModule {}
