import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { GenerateCollaboratorsTemplateUseCase } from '../../application/use-cases/generate-collaborators-template.use-case';
import { ImportCollaboratorsUseCase } from '../../application/use-cases/import-collaborators.use-case';
import { MAX_IMPORT_FILE_SIZE_BYTES } from '../../shared/constants/import-collaborators.constants';
import { FileTooLargeFilter } from '../filters/file-too-large.filter';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin/import/collaborators')
export class AdminImportController {
  constructor(
    private readonly generateCollaboratorsTemplateUseCase: GenerateCollaboratorsTemplateUseCase,
    private readonly importCollaboratorsUseCase: ImportCollaboratorsUseCase,
  ) {}

  @Get('template')
  async template(@Res() res: Response) {
    const buffer = await this.generateCollaboratorsTemplateUseCase.execute();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="plantilla-carga-colaboradores.xlsx"',
    });
    res.send(Buffer.from(buffer));
  }

  @Post()
  @UseFilters(FileTooLargeFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMPORT_FILE_SIZE_BYTES },
    }),
  )
  import(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        message: 'Debes adjuntar un archivo .xlsx',
      });
    }
    return this.importCollaboratorsUseCase.execute(file.buffer);
  }
}
