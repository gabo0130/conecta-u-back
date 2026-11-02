import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { NEED_REPOSITORY } from '../../shared/interfaces/tokens';
import { pickDefined } from '../../shared/utils/pick-defined';
import { UpdateNeedDto } from '../dto/needs.dto';
import { toNeedResponse } from '../mappers/need-response.mapper';
import { scoreNeed } from '../needs/need-scores';
import { loadOpenOwnedNeed, NOT_FOUND } from '../support/need-access';

/** El formulador corrige o completa su necesidad mientras siga abierta. */
@Injectable()
export class UpdateNeedUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
  ) {}

  async execute(userId: string, needId: string, data: UpdateNeedDto) {
    const need = await loadOpenOwnedNeed(this.needRepository, userId, needId);
    const changes = pickDefined(data);
    const updated = await this.needRepository.update(needId, {
      ...changes,
      ...scoreNeed({ ...need, ...changes }),
    });
    if (!updated) throw new NotFoundException({ message: NOT_FOUND });
    return toNeedResponse(updated);
  }
}
