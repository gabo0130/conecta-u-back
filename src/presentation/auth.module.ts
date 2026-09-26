import { Module } from '@nestjs/common';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { AuthController } from './controllers/auth.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [AuthController],
  providers: [GetMeUseCase, LoginUseCase, RefreshTokenUseCase, RegisterUseCase],
})
export class AuthModule {}
