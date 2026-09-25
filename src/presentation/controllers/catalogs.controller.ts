import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ProposeSkillDto } from '../../application/dto/propose-skill.dto';
import { ListProgramsUseCase } from '../../application/use-cases/list-programs.use-case';
import { ListProjectCategoriesUseCase } from '../../application/use-cases/list-project-categories.use-case';
import { ListProjectTypesUseCase } from '../../application/use-cases/list-project-types.use-case';
import { ProposeSkillUseCase } from '../../application/use-cases/propose-skill.use-case';
import { SearchSkillsUseCase } from '../../application/use-cases/search-skills.use-case';
import type { SkillType } from '../../domain/entities/skill-type.type';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('catalogs')
export class CatalogsController {
  constructor(
    private readonly listProgramsUseCase: ListProgramsUseCase,
    private readonly searchSkillsUseCase: SearchSkillsUseCase,
    private readonly proposeSkillUseCase: ProposeSkillUseCase,
    private readonly listProjectTypesUseCase: ListProjectTypesUseCase,
    private readonly listProjectCategoriesUseCase: ListProjectCategoriesUseCase,
  ) {}

  @Get('programs')
  listPrograms() {
    return this.listProgramsUseCase.execute();
  }

  @UseGuards(JwtAuthGuard)
  @Get('skills')
  searchSkills(@Query('q') q?: string, @Query('type') type?: SkillType) {
    return this.searchSkillsUseCase.execute(q, type);
  }

  @UseGuards(JwtAuthGuard)
  @Post('skills')
  proposeSkill(@Body() dto: ProposeSkillDto) {
    return this.proposeSkillUseCase.execute(dto);
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Authorize({ anyOfRoles: ['LIDER'] })
  @Get('project-types')
  listProjectTypes() {
    return this.listProjectTypesUseCase.execute();
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Authorize({ anyOfRoles: ['LIDER'] })
  @Get('project-categories')
  listProjectCategories() {
    return this.listProjectCategoriesUseCase.execute();
  }
}
