import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PaginationQueryDto } from '../../application/dto/pagination-query.dto';
import { AdminGetImportRunUseCase } from '../../application/use-cases/admin-get-import-run.use-case';
import { AdminListImportRunsUseCase } from '../../application/use-cases/admin-list-import-runs.use-case';
import { GenerateCollaboratorsTemplateUseCase } from '../../application/use-cases/generate-collaborators-template.use-case';
import { ImportCollaboratorsUseCase } from '../../application/use-cases/import-collaborators.use-case';
import { MAX_IMPORT_FILE_SIZE_BYTES } from '../../shared/constants/import-collaborators.constants';
import { FileTooLargeFilter } from '../filters/file-too-large.filter';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin/import/collaborators')
export class AdminImportController {
  constructor(
    private readonly generateCollaboratorsTemplateUseCase: GenerateCollaboratorsTemplateUseCase,
    private readonly importCollaboratorsUseCase: ImportCollaboratorsUseCase,
    private readonly adminListImportRunsUseCase: AdminListImportRunsUseCase,
    private readonly adminGetImportRunUseCase: AdminGetImportRunUseCase,
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

  @Get('runs')
  listRuns(@Query() query: PaginationQueryDto) {
    return this.adminListImportRunsUseCase.execute(query);
  }

  @Get('runs/:id')
  getRun(@Param('id', UuidParamPipe) id: string) {
    return this.adminGetImportRunUseCase.execute(id);
  }

  @Post()
  @UseFilters(FileTooLargeFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMPORT_FILE_SIZE_BYTES },
    }),
  )
  import(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        message: 'Debes adjuntar un archivo .xlsx',
      });
    }
    return this.importCollaboratorsUseCase.execute(
      file.buffer,
      file.originalname,
      request.user!.userId,
    );
  }
}
