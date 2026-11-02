import { Inject, Injectable } from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { NEED_REPOSITORY } from '../../shared/interfaces/tokens';
import { CreateNeedDto } from '../dto/needs.dto';
import { toNeedResponse } from '../mappers/need-response.mapper';
import { scoreNeed } from '../needs/need-scores';

/** Tesis (D1): el formulador (LIDER) registra una necesidad en lenguaje natural. */
@Injectable()
export class CreateNeedUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
  ) {}

  async execute(userId: string, data: CreateNeedDto) {
    const declared = {
      urgency: data.urgency,
      impact: data.impact,
      deadline: data.deadline ?? null,
      dependency: data.dependency ?? null,
    };
    const need = await this.needRepository.create({
      title: data.title,
      description: data.description,
      kind: data.kind,
      ...declared,
      ...scoreNeed({ ...declared, characterization: null }),
      priorityScore: 0,
      createdById: userId,
    });
    return toNeedResponse(need);
  }
}
