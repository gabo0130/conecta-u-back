import { Inject, Injectable } from '@nestjs/common';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { SKILL_REPOSITORY } from '../../shared/interfaces/tokens';
import { ProposeSkillDto } from '../dto/propose-skill.dto';
import { resolveOrProposeSkill } from '../support/skill-resolver';

@Injectable()
export class ProposeSkillUseCase {
  constructor(
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async execute(data: ProposeSkillDto) {
    const { skill } = await resolveOrProposeSkill(this.skillRepository, data);
    return skill;
  }
}
