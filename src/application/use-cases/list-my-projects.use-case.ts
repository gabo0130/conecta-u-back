import { Inject, Injectable } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { PROJECT_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class ListMyProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(leaderId: string) {
    const projects = await this.projectRepository.findByLeaderId(leaderId);
    return { projects };
  }
}
