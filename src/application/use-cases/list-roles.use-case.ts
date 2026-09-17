import { Injectable } from '@nestjs/common';
import { ROLES_CATALOG } from '../../domain/entities/roles-catalog';

@Injectable()
export class ListRolesUseCase {
  execute() {
    return { roles: ROLES_CATALOG };
  }
}
