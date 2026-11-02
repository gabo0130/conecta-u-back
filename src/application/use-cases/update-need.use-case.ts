import { Inject, Injectable } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { NEED_REPOSITORY } from '../../shared/interfaces/tokens';
import { pickDefined } from '../../shared/utils/pick-defined';
import { UpdateNeedDto } from '../dto/needs.dto';
import { toNeedResponse } from '../mappers/need-response.mapper';
import { scoreNeed } from '../needs/need-scores';
import { loadOpenOwnedNeed, requireStillOpen } from '../support/need-access';

/**
 * El formulador corrige o completa su necesidad mientras siga abierta. Si cambia lo que la IA
 * leyó (título, descripción o tipo), la caracterización deja de valer: se borra y la necesidad
 * vuelve a REGISTRADA para caracterizarla de nuevo.
 */
@Injectable()
export class UpdateNeedUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
  ) {}

  async execute(userId: string, needId: string, data: UpdateNeedDto) {
    const need = await loadOpenOwnedNeed(this.needRepository, userId, needId);
    const changes = pickDefined(data);
    const textChanged =
      (changes.title !== undefined && changes.title !== need.title) ||
      (changes.description !== undefined &&
        changes.description !== need.description) ||
      (changes.kind !== undefined && changes.kind !== need.kind);
    const reset =
      textChanged && need.characterization
        ? {
            characterization: null,
            characterizedAt: null,
            status: 'REGISTRADA' as const,
          }
        : {};
    const next = { ...need, ...changes, ...reset };
    const updated = await this.needRepository.updateIfOpen(needId, {
      ...changes,
      ...reset,
      ...scoreNeed(next),
    });
    return toNeedResponse(requireStillOpen(updated));
  }
}
