import { Inject, Injectable } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class ListMySkillsUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(userId: string) {
    const skills = await this.skillRepository.findByCollaboratorId(userId);
    return { skills };
  }
}
