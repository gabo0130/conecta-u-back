import { Inject, Injectable } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import { ProposeSkillDto } from '../dto/propose-skill.dto';

@Injectable()
export class ProposeSkillUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(data: ProposeSkillDto) {
    const normalizedName = normalizeSkillName(data.name);

    const existing =
      await this.skillRepository.findByNormalizedNameOrSynonym(normalizedName);
    if (existing) {
      return existing;
    }

    return this.skillRepository.create({
      name: data.name.trim(),
      normalizedName,
      type: data.type,
      category: data.category ?? 'OTRA',
      status: 'PENDIENTE',
    });
  }
}
