import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CERTIFICATE_MAX_SIZE_BYTES } from '../../domain/entities/experience-certificate';
import { DeleteMyExperienceCertificateUseCase } from '../../application/use-cases/delete-my-experience-certificate.use-case';
import { GetExperienceCertificateUseCase } from '../../application/use-cases/get-experience-certificate.use-case';
import { UploadMyExperienceCertificateUseCase } from '../../application/use-cases/upload-my-experience-certificate.use-case';
import { CertificateTooLargeFilter } from '../filters/certificate-too-large.filter';
import { sendCertificate } from '../support/send-certificate';
import { ExperienceDto } from '../../application/dto/experience.dto';
import { CreateMyExperienceUseCase } from '../../application/use-cases/create-my-experience.use-case';
import { DeleteMyExperienceUseCase } from '../../application/use-cases/delete-my-experience.use-case';
import { UpdateMyExperienceUseCase } from '../../application/use-cases/update-my-experience.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** Experiencia del perfil con dedicación y nivel, y su certificado (RF4; v2.2, E8). */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['COLABORADOR', 'LIDER'] })
@Controller('collaborators/me/experience')
export class CollaboratorExperienceController {
  constructor(
    private readonly createMyExperienceUseCase: CreateMyExperienceUseCase,
    private readonly updateMyExperienceUseCase: UpdateMyExperienceUseCase,
    private readonly deleteMyExperienceUseCase: DeleteMyExperienceUseCase,
    private readonly uploadCertificateUseCase: UploadMyExperienceCertificateUseCase,
    private readonly deleteCertificateUseCase: DeleteMyExperienceCertificateUseCase,
    private readonly getCertificateUseCase: GetExperienceCertificateUseCase,
  ) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: ExperienceDto) {
    return this.createMyExperienceUseCase.execute(request.user!.userId, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: ExperienceDto,
  ) {
    return this.updateMyExperienceUseCase.execute(
      request.user!.userId,
      id,
      dto,
    );
  }

  @HttpCode(204)
  @Delete(':id')
  delete(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.deleteMyExperienceUseCase.execute(request.user!.userId, id);
  }

  /** Multipart con el campo `file` (PDF, PNG o JPG, máx. 2 MB). Reemplaza el anterior. */
  @Put(':id/certificate')
  @UseFilters(CertificateTooLargeFilter)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: CERTIFICATE_MAX_SIZE_BYTES },
    }),
  )
  uploadCertificate(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.uploadCertificateUseCase.execute(
      request.user!.userId,
      id,
      file && { buffer: file.buffer, originalName: file.originalname },
    );
  }

  @Get(':id/certificate')
  async downloadCertificate(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Res() res: Response,
  ) {
    sendCertificate(
      res,
      await this.getCertificateUseCase.forOwner(request.user!.userId, id),
    );
  }

  @HttpCode(204)
  @Delete(':id/certificate')
  deleteCertificate(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.deleteCertificateUseCase.execute(request.user!.userId, id);
  }
}
