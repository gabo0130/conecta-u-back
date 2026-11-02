import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { NEED_REPOSITORY } from '../../shared/interfaces/tokens';
import { pickDefined } from '../../shared/utils/pick-defined';
import { UpdateNeedDto } from '../dto/needs.dto';
import { toNeedResponse } from '../mappers/need-response.mapper';
import { loadOpenOwnedNeed, NOT_FOUND } from '../support/need-access';

/** El formulador corrige o completa su necesidad mientras siga abierta. */
@Injectable()
export class UpdateNeedUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
  ) {}

  async execute(userId: string, needId: string, data: UpdateNeedDto) {
    await loadOpenOwnedNeed(this.needRepository, userId, needId);
    const updated = await this.needRepository.update(needId, pickDefined(data));
    if (!updated) throw new NotFoundException({ message: NOT_FOUND });
    return toNeedResponse(updated);
  }
}
