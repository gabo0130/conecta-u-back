import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import { PROJECT_TYPE_REPOSITORY } from '../../shared/interfaces/tokens';
import { CreateProjectTypeDto } from '../dto/create-project-type.dto';
import { validateTemplateFields } from '../support/template-fields';

/** ADMIN: crea un tipo de proyecto con su plantilla de campos (RF7/RF22). */
@Injectable()
export class CreateProjectTypeUseCase {
  constructor(
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async execute(data: CreateProjectTypeDto) {
    const errors = validateTemplateFields(data.templateFields);
    if (errors.length > 0) {
      throw new BadRequestException({ message: errors.join('; ') });
    }

    return this.projectTypeRepository.create({
      code: data.code,
      name: data.name,
      templateFields: data.templateFields,
    });
  }
}
