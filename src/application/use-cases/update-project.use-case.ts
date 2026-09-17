import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { PROJECT_REPOSITORY } from '../../shared/interfaces/tokens';
import { UpdateProjectDto } from '../dto/update-project.dto';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(leaderId: string, projectId: string, data: UpdateProjectDto) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    if (project.leaderId !== leaderId) {
      throw new ForbiddenException({ message: 'Prohibido' });
    }

    const updated = await this.projectRepository.update(projectId, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.objectives !== undefined ? { objectives: data.objectives } : {}),
      ...(data.knownSkills !== undefined
        ? { knownSkills: data.knownSkills }
        : {}),
      ...(data.semillero !== undefined ? { semillero: data.semillero } : {}),
      ...(data.program !== undefined ? { program: data.program } : {}),
    });

    if (!updated) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }

    return updated;
  }
}
