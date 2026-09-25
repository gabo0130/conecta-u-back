import { Inject, Injectable } from '@nestjs/common';
import type { SkillType } from '../../domain/entities/skill-type.type';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class SearchSkillsUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(query?: string, type?: SkillType) {
    return { skills: await this.skillRepository.search({ query, type }) };
  }
}
