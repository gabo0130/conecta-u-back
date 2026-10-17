import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreateRequiredProfileDto,
  UpdateRequiredProfileDto,
} from '../../application/dto/required-profile.dto';
import { CreateRequiredProfileUseCase } from '../../application/use-cases/create-required-profile.use-case';
import { UpdateRequiredProfileUseCase } from '../../application/use-cases/update-required-profile.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** RF13: el líder dueño agrega perfiles a mano, los edita o los descarta. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['LIDER'] })
@Controller('projects/:id/required-profiles')
export class RequiredProfilesController {
  constructor(
    private readonly createUseCase: CreateRequiredProfileUseCase,
    private readonly updateUseCase: UpdateRequiredProfileUseCase,
  ) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: CreateRequiredProfileDto,
  ) {
    return this.createUseCase.execute(request.user!.userId, id, dto);
  }

  @Patch(':profileId')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Param('profileId', UuidParamPipe) profileId: string,
    @Body() dto: UpdateRequiredProfileDto,
  ) {
    return this.updateUseCase.execute(request.user!.userId, id, profileId, dto);
  }
}
