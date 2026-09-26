import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AvailabilityDto } from '../../application/dto/availability.dto';
import { CollaboratorSkillDto } from '../../application/dto/collaborator-skill.dto';
import { CreateMyCollaboratorDto } from '../../application/dto/create-my-collaborator.dto';
import { ExperienceDto } from '../../application/dto/experience.dto';
import { UpdateCollaboratorDto } from '../../application/dto/update-collaborator.dto';
import { AddMyCollaboratorSkillUseCase } from '../../application/use-cases/add-my-collaborator-skill.use-case';
import { CreateMyCollaboratorProfileUseCase } from '../../application/use-cases/create-my-collaborator-profile.use-case';
import { CreateMyExperienceUseCase } from '../../application/use-cases/create-my-experience.use-case';
import { DeleteMyCollaboratorSkillUseCase } from '../../application/use-cases/delete-my-collaborator-skill.use-case';
import { DeleteMyExperienceUseCase } from '../../application/use-cases/delete-my-experience.use-case';
import { GetMyCollaboratorProfileUseCase } from '../../application/use-cases/get-my-collaborator-profile.use-case';
import { ListMyCollaboratorSkillsUseCase } from '../../application/use-cases/list-my-collaborator-skills.use-case';
import { UpdateMyAvailabilityUseCase } from '../../application/use-cases/update-my-availability.use-case';
import { UpdateMyCollaboratorProfileUseCase } from '../../application/use-cases/update-my-collaborator-profile.use-case';
import { UpdateMyCollaboratorSkillUseCase } from '../../application/use-cases/update-my-collaborator-skill.use-case';
import { UpdateMyExperienceUseCase } from '../../application/use-cases/update-my-experience.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['COLABORADOR', 'LIDER'] })
@Controller('collaborators')
export class CollaboratorsController {
  constructor(
    private readonly createMyCollaboratorProfileUseCase: CreateMyCollaboratorProfileUseCase,
    private readonly getMyCollaboratorProfileUseCase: GetMyCollaboratorProfileUseCase,
    private readonly updateMyCollaboratorProfileUseCase: UpdateMyCollaboratorProfileUseCase,
    private readonly listMyCollaboratorSkillsUseCase: ListMyCollaboratorSkillsUseCase,
    private readonly addMyCollaboratorSkillUseCase: AddMyCollaboratorSkillUseCase,
    private readonly updateMyCollaboratorSkillUseCase: UpdateMyCollaboratorSkillUseCase,
    private readonly deleteMyCollaboratorSkillUseCase: DeleteMyCollaboratorSkillUseCase,
    private readonly createMyExperienceUseCase: CreateMyExperienceUseCase,
    private readonly updateMyExperienceUseCase: UpdateMyExperienceUseCase,
    private readonly deleteMyExperienceUseCase: DeleteMyExperienceUseCase,
    private readonly updateMyAvailabilityUseCase: UpdateMyAvailabilityUseCase,
  ) {}

  @Post('me')
  createMe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateMyCollaboratorDto,
  ) {
    return this.createMyCollaboratorProfileUseCase.execute(
      request.user!.userId,
      dto,
    );
  }

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.getMyCollaboratorProfileUseCase.execute(request.user!.userId);
  }

  @Patch('me')
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateCollaboratorDto,
  ) {
    return this.updateMyCollaboratorProfileUseCase.execute(
      request.user!.userId,
      dto,
    );
  }

  @Get('me/skills')
  listSkills(@Req() request: AuthenticatedRequest) {
    return this.listMyCollaboratorSkillsUseCase.execute(request.user!.userId);
  }

  @Post('me/skills')
  addSkill(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CollaboratorSkillDto,
  ) {
    return this.addMyCollaboratorSkillUseCase.execute(
      request.user!.userId,
      dto,
    );
  }

  @Patch('me/skills/:id')
  updateSkill(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: CollaboratorSkillDto,
  ) {
    return this.updateMyCollaboratorSkillUseCase.execute(
      request.user!.userId,
      id,
      dto,
    );
  }

  @HttpCode(204)
  @Delete('me/skills/:id')
  deleteSkill(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.deleteMyCollaboratorSkillUseCase.execute(
      request.user!.userId,
      id,
    );
  }

  @Post('me/experience')
  createExperience(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ExperienceDto,
  ) {
    return this.createMyExperienceUseCase.execute(request.user!.userId, dto);
  }

  @Patch('me/experience/:id')
  updateExperience(
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
  @Delete('me/experience/:id')
  deleteExperience(
    @Req() request: AuthenticatedRequest,
    @Param('id', UuidParamPipe) id: string,
  ) {
    return this.deleteMyExperienceUseCase.execute(request.user!.userId, id);
  }

  @Patch('me/availability')
  updateAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AvailabilityDto,
  ) {
    return this.updateMyAvailabilityUseCase.execute(request.user!.userId, dto);
  }
}
