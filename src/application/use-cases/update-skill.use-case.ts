import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { SkillDto } from '../dto/skill.dto';

@Injectable()
export class UpdateSkillUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(userId: string, skillId: string, data: SkillDto) {
    const skill = await this.skillRepository.findById(skillId);
    if (!skill || skill.collaboratorId !== userId) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    const updated = await this.skillRepository.update(skillId, {
      name: data.name,
      type: data.type,
      level: data.level ?? null,
    });

    if (!updated) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return updated;
  }
}
