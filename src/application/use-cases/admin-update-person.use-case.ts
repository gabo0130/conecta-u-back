import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  PROGRAM_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { pickDefined } from '../../shared/utils/pick-defined';
import {
  AdminPersonStatusDto,
  AdminUpdatePersonProfileDto,
} from '../dto/admin-person.dto';
import { findProgramOrFail } from '../support/catalog-references';
import { AdminGetCollaboratorUseCase } from './admin-get-collaborator.use-case';

/**
 * RF17 (HU-15): el ADMIN corrige el perfil de una persona y la da de baja o la reactiva.
 * Dar de baja (`active=false`) la saca de las recomendaciones: el repositorio borra su vector
 * y sus recomendaciones guardadas en la misma transacción. No toca la cuenta (eso es RF14).
 */
@Injectable()
export class AdminUpdatePersonUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
    private readonly getCollaborator: AdminGetCollaboratorUseCase,
  ) {}

  async updateProfile(id: string, data: AdminUpdatePersonProfileDto) {
    await this.findOrFail(id);
    if (data.programId) {
      await findProgramOrFail(this.programRepository, data.programId);
    }
    await this.collaboratorRepository.update(id, pickDefined(data));
    return this.getCollaborator.execute(id);
  }

  async setStatus(id: string, data: AdminPersonStatusDto) {
    await this.findOrFail(id);
    await this.collaboratorRepository.update(id, { active: data.active });
    return this.getCollaborator.execute(id);
  }

  private async findOrFail(id: string) {
    const person = await this.collaboratorRepository.findById(id);
    if (!person)
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    return person;
  }
}
