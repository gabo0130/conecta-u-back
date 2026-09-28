import { Inject, Injectable } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { PROJECT_REPOSITORY } from '../../shared/interfaces/tokens';
import {
  toPageMeta,
  type PageParams,
} from '../../shared/pagination/pagination.util';
import { toProjectResponse } from '../mappers/project-response.mapper';

@Injectable()
export class ListMyProjectsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(leaderId: string, params: PageParams) {
    const { items: projects, total } =
      await this.projectRepository.findByLeaderId(leaderId, params);
    return {
      projects: projects.map(toProjectResponse),
      meta: toPageMeta(params.page, params.pageSize, total),
    };
  }
}
