import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AdminCreatePersonDto,
  AdminPersonStatusDto,
  AdminUpdatePersonProfileDto,
} from '../../application/dto/admin-person.dto';
import { AdminCreatePersonUseCase } from '../../application/use-cases/admin-create-person.use-case';
import { AdminUpdatePersonUseCase } from '../../application/use-cases/admin-update-person.use-case';
import { GetExperienceCertificateUseCase } from '../../application/use-cases/get-experience-certificate.use-case';
import { sendCertificate } from '../support/send-certificate';
import { AdminGetCollaboratorUseCase } from '../../application/use-cases/admin-get-collaborator.use-case';
import { AdminGetProjectUseCase } from '../../application/use-cases/admin-get-project.use-case';
import { AdminListCollaboratorsUseCase } from '../../application/use-cases/admin-list-collaborators.use-case';
import { AdminListProjectsUseCase } from '../../application/use-cases/admin-list-projects.use-case';
import { AdminUpdateCollaboratorIdentificationUseCase } from '../../application/use-cases/admin-update-collaborator-identification.use-case';
import { UpdateIdentificationDto } from '../../application/dto/person-identification.dto';
import { PaginationQueryDto } from '../../application/dto/pagination-query.dto';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** Vista global del ADMIN: proyectos, y gestión de personas con o sin cuenta (RF7, RF17). */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminListProjectsUseCase: AdminListProjectsUseCase,
    private readonly adminGetProjectUseCase: AdminGetProjectUseCase,
    private readonly adminListCollaboratorsUseCase: AdminListCollaboratorsUseCase,
    private readonly adminGetCollaboratorUseCase: AdminGetCollaboratorUseCase,
    private readonly adminUpdateIdentificationUseCase: AdminUpdateCollaboratorIdentificationUseCase,
    private readonly getCertificateUseCase: GetExperienceCertificateUseCase,
    private readonly adminCreatePersonUseCase: AdminCreatePersonUseCase,
    private readonly adminUpdatePersonUseCase: AdminUpdatePersonUseCase,
  ) {}

  @Get('projects')
  listProjects(@Query() query: PaginationQueryDto) {
    return this.adminListProjectsUseCase.execute(query);
  }

  @Get('projects/:id')
  getProject(@Param('id', UuidParamPipe) id: string) {
    return this.adminGetProjectUseCase.execute(id);
  }

  @Get('collaborators')
  listCollaborators(@Query() query: PaginationQueryDto) {
    return this.adminListCollaboratorsUseCase.execute(query);
  }

  /** RF17: registrar una persona sin cuenta. */
  @Post('collaborators')
  createPerson(@Body() body: AdminCreatePersonDto) {
    return this.adminCreatePersonUseCase.execute(body);
  }

  /** RF17: corregir los datos de perfil de una persona. */
  @Patch('collaborators/:id/profile')
  updatePersonProfile(
    @Param('id', UuidParamPipe) id: string,
    @Body() body: AdminUpdatePersonProfileDto,
  ) {
    return this.adminUpdatePersonUseCase.updateProfile(id, body);
  }

  /** RF17: dar de baja (`active: false`) o reactivar a una persona. */
  @Patch('collaborators/:id/status')
  setPersonStatus(
    @Param('id', UuidParamPipe) id: string,
    @Body() body: AdminPersonStatusDto,
  ) {
    return this.adminUpdatePersonUseCase.setStatus(id, body);
  }

  @Get('collaborators/:id')
  getCollaborator(@Param('id', UuidParamPipe) id: string) {
    return this.adminGetCollaboratorUseCase.execute(id);
  }

  /** v2.1: identificación y contacto de una persona; el documento solo lo cambia el ADMIN. */
  @Patch('collaborators/:id')
  updateCollaboratorIdentification(
    @Param('id', UuidParamPipe) id: string,
    @Body() body: UpdateIdentificationDto,
  ) {
    return this.adminUpdateIdentificationUseCase.execute(id, body);
  }

  /** v2.2, E8 / RT16: el ADMIN revisa el certificado que soporta una experiencia. */
  @Get('collaborators/:id/experience/:experienceId/certificate')
  async downloadCertificate(
    @Param('id', UuidParamPipe) id: string,
    @Param('experienceId', UuidParamPipe) experienceId: string,
    @Res() res: Response,
  ) {
    sendCertificate(
      res,
      await this.getCertificateUseCase.forAdmin(id, experienceId),
    );
  }
}
