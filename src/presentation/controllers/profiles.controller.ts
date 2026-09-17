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
import { ExperienceDto } from '../../application/dto/experience.dto';
import { SkillDto } from '../../application/dto/skill.dto';
import { UpdateProfileDto } from '../../application/dto/update-profile.dto';
import { CreateExperienceUseCase } from '../../application/use-cases/create-experience.use-case';
import { CreateSkillUseCase } from '../../application/use-cases/create-skill.use-case';
import { DeleteExperienceUseCase } from '../../application/use-cases/delete-experience.use-case';
import { DeleteSkillUseCase } from '../../application/use-cases/delete-skill.use-case';
import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile.use-case';
import { ListMySkillsUseCase } from '../../application/use-cases/list-my-skills.use-case';
import { UpdateAvailabilityUseCase } from '../../application/use-cases/update-availability.use-case';
import { UpdateExperienceUseCase } from '../../application/use-cases/update-experience.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { UpdateSkillUseCase } from '../../application/use-cases/update-skill.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['COLABORADOR'] })
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly listMySkillsUseCase: ListMySkillsUseCase,
    private readonly createSkillUseCase: CreateSkillUseCase,
    private readonly updateSkillUseCase: UpdateSkillUseCase,
    private readonly deleteSkillUseCase: DeleteSkillUseCase,
    private readonly createExperienceUseCase: CreateExperienceUseCase,
    private readonly updateExperienceUseCase: UpdateExperienceUseCase,
    private readonly deleteExperienceUseCase: DeleteExperienceUseCase,
    private readonly updateAvailabilityUseCase: UpdateAvailabilityUseCase,
  ) {}

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.getMyProfileUseCase.execute(request.user!.userId);
  }

  @Patch('me')
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateMyProfileUseCase.execute(request.user!.userId, dto);
  }

  @Get('me/skills')
  listSkills(@Req() request: AuthenticatedRequest) {
    return this.listMySkillsUseCase.execute(request.user!.userId);
  }

  @Post('me/skills')
  createSkill(@Req() request: AuthenticatedRequest, @Body() dto: SkillDto) {
    return this.createSkillUseCase.execute(request.user!.userId, dto);
  }

  @Patch('me/skills/:id')
  updateSkill(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SkillDto,
  ) {
    return this.updateSkillUseCase.execute(request.user!.userId, id, dto);
  }

  @HttpCode(204)
  @Delete('me/skills/:id')
  deleteSkill(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.deleteSkillUseCase.execute(request.user!.userId, id);
  }

  @Post('me/experience')
  createExperience(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ExperienceDto,
  ) {
    return this.createExperienceUseCase.execute(request.user!.userId, dto);
  }

  @Patch('me/experience/:id')
  updateExperience(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ExperienceDto,
  ) {
    return this.updateExperienceUseCase.execute(request.user!.userId, id, dto);
  }

  @HttpCode(204)
  @Delete('me/experience/:id')
  deleteExperience(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.deleteExperienceUseCase.execute(request.user!.userId, id);
  }

  @Patch('me/availability')
  updateAvailability(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AvailabilityDto,
  ) {
    return this.updateAvailabilityUseCase.execute(request.user!.userId, dto);
  }
}
