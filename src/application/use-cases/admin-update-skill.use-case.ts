import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import { UpdateSkillDto } from '../dto/update-skill.dto';

/** ADMIN: edita una habilidad del catálogo o la aprueba (PENDIENTE → ACTIVA) (RF22). */
@Injectable()
export class AdminUpdateSkillUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(id: string, data: UpdateSkillDto) {
    const skill = await this.skillRepository.update(id, {
      ...data,
      normalizedName: data.name ? normalizeSkillName(data.name) : undefined,
    });
    if (!skill) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }
    return skill;
  }
}
