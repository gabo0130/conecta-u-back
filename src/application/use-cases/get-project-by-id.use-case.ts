import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { PROJECT_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class GetProjectByIdUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(leaderId: string, projectId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    if (project.leaderId !== leaderId) {
      throw new ForbiddenException({ message: 'Prohibido' });
    }

    return project;
  }
}
