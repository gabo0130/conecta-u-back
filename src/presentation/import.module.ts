import { Module } from '@nestjs/common';
import { GenerateCollaboratorsTemplateUseCase } from '../application/use-cases/generate-collaborators-template.use-case';
import { ImportCollaboratorsUseCase } from '../application/use-cases/import-collaborators.use-case';
import { ExcelJsCollaboratorWorkbook } from '../infrastructure/excel/exceljs-collaborator-workbook';
import {
  COLLABORATOR_TEMPLATE_WRITER,
  COLLABORATOR_WORKBOOK_READER,
} from '../shared/interfaces/tokens';
import { AdminImportController } from './controllers/admin-import.controller';
import { PersistenceModule } from './persistence.module';
import { SecurityModule } from './security.module';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [AdminImportController],
  providers: [
    GenerateCollaboratorsTemplateUseCase,
    ImportCollaboratorsUseCase,
    ExcelJsCollaboratorWorkbook,
    {
      provide: COLLABORATOR_WORKBOOK_READER,
      useExisting: ExcelJsCollaboratorWorkbook,
    },
    {
      provide: COLLABORATOR_TEMPLATE_WRITER,
      useExisting: ExcelJsCollaboratorWorkbook,
    },
  ],
})
export class ImportModule {}
