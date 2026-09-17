import { Inject, Injectable } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { SkillDto } from '../dto/skill.dto';

@Injectable()
export class CreateSkillUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(userId: string, data: SkillDto) {
    return this.skillRepository.create({
      collaboratorId: userId,
      name: data.name,
      type: data.type,
      level: data.level ?? null,
    });
  }
}
