import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { NEED_REPOSITORY } from '../../shared/interfaces/tokens';
import { DiscardNeedDto } from '../dto/needs.dto';
import { toNeedResponse } from '../mappers/need-response.mapper';
import { loadOpenOwnedNeed, NOT_FOUND } from '../support/need-access';

/** El formulador descarta una necesidad abierta; queda en el historial con su motivo. */
@Injectable()
export class DiscardNeedUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
  ) {}

  async execute(userId: string, needId: string, data: DiscardNeedDto) {
    await loadOpenOwnedNeed(this.needRepository, userId, needId);
    const updated = await this.needRepository.update(needId, {
      status: 'DESCARTADA',
      discardReason: data.reason ?? null,
    });
    if (!updated) throw new NotFoundException({ message: NOT_FOUND });
    return toNeedResponse(updated);
  }
}
