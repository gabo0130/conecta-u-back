import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AvailabilityDto } from '../../application/dto/availability.dto';
import { CreateMyCollaboratorDto } from '../../application/dto/create-my-collaborator.dto';
import { UpdateCollaboratorDto } from '../../application/dto/update-collaborator.dto';
import { CreateMyCollaboratorProfileUseCase } from '../../application/use-cases/create-my-collaborator-profile.use-case';
import { GetMyCollaboratorProfileUseCase } from '../../application/use-cases/get-my-collaborator-profile.use-case';
import { UpdateMyAvailabilityUseCase } from '../../application/use-cases/update-my-availability.use-case';
import { UpdateMyCollaboratorProfileUseCase } from '../../application/use-cases/update-my-collaborator-profile.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/** Perfil técnico del usuario autenticado: datos básicos y disponibilidad (RF3, RF6). */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['COLABORADOR', 'LIDER'] })
@Controller('collaborators/me')
export class CollaboratorProfileController {
  constructor(
    private readonly createMyCollaboratorProfileUseCase: CreateMyCollaboratorProfileUseCase,
    private readonly getMyCollaboratorProfileUseCase: GetMyCollaboratorProfileUseCase,
    private readonly updateMyCollaboratorProfileUseCase: UpdateMyCollaboratorProfileUseCase,
    private readonly updateMyAvailabilityUseCase: UpdateMyAvailabilityUseCase,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateMyCollaboratorDto,
  ) {
    return this.createMyCollaboratorProfileUseCase.execute(
      request.user!.userId,
      dto,
    );
  }

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.getMyCollaboratorProfileUseCase.execute(request.user!.userId);
  }

  @Patch()
  update(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateCollaboratorDto,
  ) {
    return this.updateMyCollaboratorProfileUseCase.execute(
      request.user!.userId,
      dto,
    );
  }

  @Patch('availability')
  updateAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AvailabilityDto,
  ) {
    return this.updateMyAvailabilityUseCase.execute(request.user!.userId, dto);
  }
}
