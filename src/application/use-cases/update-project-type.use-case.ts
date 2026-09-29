import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import { PROJECT_TYPE_REPOSITORY } from '../../shared/interfaces/tokens';
import { UpdateProjectTypeDto } from '../dto/update-project-type.dto';
import { validateTemplateFields } from '../support/template-fields';

/** ADMIN: edita un tipo de proyecto, su plantilla o su estado activo/inactivo (RF7/RF22). */
@Injectable()
export class UpdateProjectTypeUseCase {
  constructor(
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async execute(id: string, data: UpdateProjectTypeDto) {
    if (data.templateFields) {
      const errors = validateTemplateFields(data.templateFields);
      if (errors.length > 0) {
        throw new BadRequestException({ message: errors.join('; ') });
      }
    }

    const type = await this.projectTypeRepository.update(id, data);
    if (!type) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }
    return type;
  }
}
