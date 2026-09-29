import { Inject, Injectable } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { toPageMeta } from '../../shared/pagination/pagination.util';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import { AdminListSkillsQueryDto } from '../dto/admin-list-skills-query.dto';

/** ADMIN: catálogo de habilidades paginado, con filtros (RF22) — incluye las PENDIENTE por revisar. */
@Injectable()
export class AdminListSkillsUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(query: AdminListSkillsQueryDto) {
    const { page, pageSize, q, type, category, status } = query;
    const { items, total } = await this.skillRepository.findAllPaged(
      { page, pageSize },
      {
        normalizedQuery: q ? normalizeSkillName(q) : undefined,
        type,
        category,
        status,
      },
    );

    return { skills: items, meta: toPageMeta(page, pageSize, total) };
  }
}
