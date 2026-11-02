import { Inject, Injectable } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { NEED_REPOSITORY } from '../../shared/interfaces/tokens';
import { toNeedResponse } from '../mappers/need-response.mapper';
import { loadNeedForViewer } from '../support/need-access';
import type { Actor } from '../support/project-access';

@Injectable()
export class GetNeedUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
  ) {}

  async execute(actor: Actor, needId: string) {
    return toNeedResponse(
      await loadNeedForViewer(this.needRepository, actor, needId),
    );
  }
}
