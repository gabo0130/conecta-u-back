import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';
import { getMenuByRole } from '../../domain/entities/menu-catalog';
import type { UserRole } from '../../domain/entities/user-role.type';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Controller()
export class AccessController {
  constructor(private readonly listRolesUseCase: ListRolesUseCase) {}

  @Get('roles')
  @Authorize({ anyOfRoles: ['ADMIN'] })
  listRoles() {
    return this.listRolesUseCase.execute();
  }

  @Get('menu/:role')
  @Authorize({ anyOfRoles: ['LIDER', 'COLABORADOR', 'ADMIN'] })
  getMenu(@Param('role') role: UserRole) {
    return {
      role,
      menu_items: getMenuByRole(role),
    };
  }
}
