import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../shared/interfaces/tokens';
import {
  toPageMeta,
  type PageParams,
} from '../../shared/pagination/pagination.util';
import { toUserResponse } from '../mappers/user-response.mapper';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(params: PageParams) {
    const { items: users, total } = await this.userRepository.findAll(params);

    return {
      users: users.map(toUserResponse),
      meta: toPageMeta(params.page, params.pageSize, total),
    };
  }
}
