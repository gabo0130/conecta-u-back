import { Inject, Injectable } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { NEED_REPOSITORY } from '../../shared/interfaces/tokens';
import { toPageMeta } from '../../shared/pagination/pagination.util';
import { ListNeedsQueryDto } from '../dto/needs.dto';
import { toNeedSummaryResponse } from '../mappers/need-response.mapper';
import type { Actor } from '../support/project-access';

/** El formulador ve las suyas; el ADMIN, todas. */
@Injectable()
export class ListNeedsUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
  ) {}

  async execute(actor: Actor, query: ListNeedsQueryDto) {
    const { page, pageSize, status, kind, sort } = query;
    const { items, total } = await this.needRepository.findPage(
      {
        createdById: actor.role === 'ADMIN' ? undefined : actor.userId,
        status,
        kind,
        sort,
      },
      { page, pageSize },
    );
    return {
      needs: items.map(toNeedSummaryResponse),
      meta: toPageMeta(page, pageSize, total),
    };
  }
}
