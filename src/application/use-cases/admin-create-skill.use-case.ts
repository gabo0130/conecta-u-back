import { Inject, Injectable } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import { AdminCreateSkillDto } from '../dto/admin-create-skill.dto';

/** ADMIN: agrega una habilidad directamente al catálogo, ya ACTIVA por defecto (RF22). */
@Injectable()
export class AdminCreateSkillUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(data: AdminCreateSkillDto) {
    return this.skillRepository.create({
      name: data.name,
      normalizedName: normalizeSkillName(data.name),
      type: data.type,
      category: data.category,
      synonyms: data.synonyms,
      status: data.status ?? 'ACTIVA',
    });
  }
}
