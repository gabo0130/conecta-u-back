import { Inject, Injectable } from '@nestjs/common';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import { PROJECT_TYPE_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class ListProjectTypesUseCase {
  constructor(
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async execute() {
    return { projectTypes: await this.projectTypeRepository.findAll() };
  }
}
