import { Module } from '@nestjs/common';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserByIdUseCase } from '../application/use-cases/get-user-by-id.use-case';
import { ListRolesUseCase } from '../application/use-cases/list-roles.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { AccessController } from './controllers/access.controller';
import { UsersController } from './controllers/users.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [AccessController, UsersController],
  providers: [
    CreateUserUseCase,
    DeleteUserUseCase,
    GetUserByIdUseCase,
    ListRolesUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
  ],
})
export class UsersModule {}
