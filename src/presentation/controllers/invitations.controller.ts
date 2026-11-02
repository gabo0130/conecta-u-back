import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SendInvitationsDto } from '../../application/dto/invitations.dto';
import { ListInvitationsUseCase } from '../../application/use-cases/list-invitations.use-case';
import { SendInvitationsUseCase } from '../../application/use-cases/send-invitations.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** RF21–RF22 (HU-18): convocatorias por correo y su historial. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Controller('projects/:id/invitations')
export class InvitationsController {
  constructor(
    private readonly sendUseCase: SendInvitationsUseCase,
    private readonly listUseCase: ListInvitationsUseCase,
  ) {}

  @Post()
  @HttpCode(200)
  @Authorize({ anyOfRoles: ['LIDER'] })
  send(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: SendInvitationsDto,
  ) {
    return this.sendUseCase.execute(request.user!.userId, id, dto);
  }

  @Get()
  @Authorize({ anyOfRoles: ['LIDER', 'ADMIN'] })
  list(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    const { userId, role } = request.user!;
    return this.listUseCase.execute({ userId, role }, id);
  }
}
