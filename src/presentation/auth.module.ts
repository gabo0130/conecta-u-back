import { Module } from '@nestjs/common';
import { PersonAccountService } from '../application/support/person-account.service';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { AuthController } from './controllers/auth.controller';
import { MailModule } from './mail.module';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule, MailModule],
  controllers: [AuthController],
  providers: [
    GetMeUseCase,
    LoginUseCase,
    PersonAccountService,
    RefreshTokenUseCase,
    RegisterUseCase,
  ],
})
export class AuthModule {}
