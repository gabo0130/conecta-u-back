import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorTemplateWriter } from '../../domain/repositories/collaborator-workbook.interface';
import { COLLABORATOR_TEMPLATE_WRITER } from '../../shared/interfaces/tokens';

@Injectable()
export class GenerateCollaboratorsTemplateUseCase {
  constructor(
    @Inject(COLLABORATOR_TEMPLATE_WRITER)
    private readonly templateWriter: CollaboratorTemplateWriter,
  ) {}

  execute(): Promise<Uint8Array> {
    return this.templateWriter.write();
  }
}
