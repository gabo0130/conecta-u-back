import { Inject, Injectable } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { PROJECT_REPOSITORY } from '../../shared/interfaces/tokens';
import { CreateProjectDto } from '../dto/create-project.dto';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(leaderId: string, data: CreateProjectDto) {
    return this.projectRepository.create({
      title: data.title,
      summary: data.summary,
      objectives: data.objectives,
      knownSkills: data.knownSkills ?? null,
      semillero: data.semillero ?? null,
      program: data.program ?? null,
      leaderId,
    });
  }
}
