import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  USER_ROLES,
  type UserRole,
} from '../../../domain/entities/user-role.type';
import { UserEntity } from '../../../domain/entities/user.entity';
import {
  UserRepository,
  type CreateUserRepositoryDto,
  type UpdateUserRepositoryDto,
} from '../../../domain/repositories/user.repository.interface';
import { UserOrmEntity } from './user.orm-entity';
import { pickDefined } from '../../../shared/utils/pick-defined';
import type { Page, PageParams } from '../../../shared/pagination/pagination.util';
import { toSkip } from '../../../shared/pagination/pagination.util';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.repository.findOne({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    const user = await this.repository.findOne({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        active: true,
      },
    });
    return user ? this.toDomain(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.repository.findOne({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    const users = await this.repository.find({ where: { id: In(ids) } });
    return users.map((user) => this.toDomain(user));
  }

  async findAll(params: PageParams): Promise<Page<UserEntity>> {
    const [users, total] = await this.repository.findAndCount({
      order: { id: 'ASC' },
      skip: toSkip(params.page, params.pageSize),
      take: params.pageSize,
    });
    return { items: users.map((user) => this.toDomain(user)), total };
  }

  async create(data: CreateUserRepositoryDto): Promise<UserEntity> {
    const user = this.repository.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    });

    const saved = await this.repository.save(user);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: UpdateUserRepositoryDto,
  ): Promise<UserEntity | null> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    const merged = this.repository.merge(user, pickDefined(data));

    const saved = await this.repository.save(merged);
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toDomain(user: UserOrmEntity): UserEntity {
    const role = USER_ROLES.includes(user.role as UserRole)
      ? (user.role as UserRole)
      : 'COLABORADOR';

    return new UserEntity(
      user.id,
      user.fullName,
      user.email,
      user.passwordHash ?? '',
      role,
      user.active,
    );
  }
}
