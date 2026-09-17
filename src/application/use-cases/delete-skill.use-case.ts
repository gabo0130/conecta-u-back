import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class DeleteSkillUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(userId: string, skillId: string): Promise<void> {
    const skill = await this.skillRepository.findById(skillId);
    if (!skill || skill.collaboratorId !== userId) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    await this.skillRepository.delete(skillId);
  }
}
