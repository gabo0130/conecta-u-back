import { Module } from '@nestjs/common';
import { CreateNeedUseCase } from '../application/use-cases/create-need.use-case';
import { DiscardNeedUseCase } from '../application/use-cases/discard-need.use-case';
import { GetNeedUseCase } from '../application/use-cases/get-need.use-case';
import { ListNeedsUseCase } from '../application/use-cases/list-needs.use-case';
import { UpdateNeedUseCase } from '../application/use-cases/update-need.use-case';
import { NeedsController } from './controllers/needs.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

/** Tesis (PGCS01): necesidades institucionales → caracterización → oportunidad. */
@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [NeedsController],
  providers: [
    CreateNeedUseCase,
    ListNeedsUseCase,
    GetNeedUseCase,
    UpdateNeedUseCase,
    DiscardNeedUseCase,
  ],
})
export class NeedsModule {}
