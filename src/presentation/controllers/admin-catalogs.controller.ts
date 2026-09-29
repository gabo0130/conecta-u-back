import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminCreateSkillDto } from '../../application/dto/admin-create-skill.dto';
import { AdminListSkillsQueryDto } from '../../application/dto/admin-list-skills-query.dto';
import { CreateProgramDto } from '../../application/dto/create-program.dto';
import { CreateProjectCategoryDto } from '../../application/dto/create-project-category.dto';
import { CreateProjectTypeDto } from '../../application/dto/create-project-type.dto';
import { UpdateProgramDto } from '../../application/dto/update-program.dto';
import { UpdateProjectCategoryDto } from '../../application/dto/update-project-category.dto';
import { UpdateProjectTypeDto } from '../../application/dto/update-project-type.dto';
import { UpdateSkillDto } from '../../application/dto/update-skill.dto';
import { AdminCreateSkillUseCase } from '../../application/use-cases/admin-create-skill.use-case';
import { AdminListProgramsUseCase } from '../../application/use-cases/admin-list-programs.use-case';
import { AdminListProjectCategoriesUseCase } from '../../application/use-cases/admin-list-project-categories.use-case';
import { AdminListProjectTypesUseCase } from '../../application/use-cases/admin-list-project-types.use-case';
import { AdminListSkillsUseCase } from '../../application/use-cases/admin-list-skills.use-case';
import { AdminUpdateSkillUseCase } from '../../application/use-cases/admin-update-skill.use-case';
import { CreateProgramUseCase } from '../../application/use-cases/create-program.use-case';
import { CreateProjectCategoryUseCase } from '../../application/use-cases/create-project-category.use-case';
import { CreateProjectTypeUseCase } from '../../application/use-cases/create-project-type.use-case';
import { UpdateProgramUseCase } from '../../application/use-cases/update-program.use-case';
import { UpdateProjectCategoryUseCase } from '../../application/use-cases/update-project-category.use-case';
import { UpdateProjectTypeUseCase } from '../../application/use-cases/update-project-type.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UuidParamPipe } from '../pipes/uuid-param.pipe';

/** Gestión de catálogos por el ADMIN (RF22): programas, tipos/categorías de proyecto y habilidades. */
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin/catalogs')
export class AdminCatalogsController {
  constructor(
    private readonly adminListProgramsUseCase: AdminListProgramsUseCase,
    private readonly createProgramUseCase: CreateProgramUseCase,
    private readonly updateProgramUseCase: UpdateProgramUseCase,
    private readonly adminListProjectTypesUseCase: AdminListProjectTypesUseCase,
    private readonly createProjectTypeUseCase: CreateProjectTypeUseCase,
    private readonly updateProjectTypeUseCase: UpdateProjectTypeUseCase,
    private readonly adminListProjectCategoriesUseCase: AdminListProjectCategoriesUseCase,
    private readonly createProjectCategoryUseCase: CreateProjectCategoryUseCase,
    private readonly updateProjectCategoryUseCase: UpdateProjectCategoryUseCase,
    private readonly adminListSkillsUseCase: AdminListSkillsUseCase,
    private readonly adminCreateSkillUseCase: AdminCreateSkillUseCase,
    private readonly adminUpdateSkillUseCase: AdminUpdateSkillUseCase,
  ) {}

  @Get('programs')
  listPrograms() {
    return this.adminListProgramsUseCase.execute();
  }

  @Post('programs')
  createProgram(@Body() dto: CreateProgramDto) {
    return this.createProgramUseCase.execute(dto);
  }

  @Patch('programs/:id')
  updateProgram(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.updateProgramUseCase.execute(id, dto);
  }

  @Get('project-types')
  listProjectTypes() {
    return this.adminListProjectTypesUseCase.execute();
  }

  @Post('project-types')
  createProjectType(@Body() dto: CreateProjectTypeDto) {
    return this.createProjectTypeUseCase.execute(dto);
  }

  @Patch('project-types/:id')
  updateProjectType(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateProjectTypeDto,
  ) {
    return this.updateProjectTypeUseCase.execute(id, dto);
  }

  @Get('project-categories')
  listProjectCategories() {
    return this.adminListProjectCategoriesUseCase.execute();
  }

  @Post('project-categories')
  createProjectCategory(@Body() dto: CreateProjectCategoryDto) {
    return this.createProjectCategoryUseCase.execute(dto);
  }

  @Patch('project-categories/:id')
  updateProjectCategory(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateProjectCategoryDto,
  ) {
    return this.updateProjectCategoryUseCase.execute(id, dto);
  }

  @Get('skills')
  listSkills(@Query() query: AdminListSkillsQueryDto) {
    return this.adminListSkillsUseCase.execute(query);
  }

  @Post('skills')
  createSkill(@Body() dto: AdminCreateSkillDto) {
    return this.adminCreateSkillUseCase.execute(dto);
  }

  @Patch('skills/:id')
  updateSkill(
    @Param('id', UuidParamPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.adminUpdateSkillUseCase.execute(id, dto);
  }
}
