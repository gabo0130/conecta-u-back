import { Inject, Injectable } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import { SearchSkillsQueryDto } from '../dto/search-skills-query.dto';

@Injectable()
export class SearchSkillsUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(filter: SearchSkillsQueryDto) {
    // Se normaliza igual que el catálogo: "Programación" encuentra "programacion", "Node.js" encuentra "nodejs".
    const normalizedQuery = filter.q ? normalizeSkillName(filter.q) : undefined;
    const skills = await this.skillRepository.search({
      normalizedQuery,
      type: filter.type,
    });
    return { skills };
  }
}
