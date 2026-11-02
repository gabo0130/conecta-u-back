import { Module } from '@nestjs/common';
import { ListInvitationsUseCase } from '../application/use-cases/list-invitations.use-case';
import { SendInvitationsUseCase } from '../application/use-cases/send-invitations.use-case';
import { InvitationsController } from './controllers/invitations.controller';
import { MailModule } from './mail.module';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

/** Convocatorias por correo a personas recomendadas (RF21–RF22). */
@Module({
  imports: [PersistenceModule, SecurityModule, MailModule],
  controllers: [InvitationsController],
  providers: [SendInvitationsUseCase, ListInvitationsUseCase],
})
export class InvitationsModule {}
