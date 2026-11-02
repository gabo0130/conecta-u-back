import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import type { PasswordResetToken } from '../../../domain/entities/password-reset';
import type {
  CreatePasswordResetTokenDto,
  PasswordResetTokenRepository,
} from '../../../domain/repositories/password-reset-token.repository.interface';
import { PasswordResetTokenOrmEntity } from './password-reset-token.orm-entity';

@Injectable()
export class TypeOrmPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenOrmEntity)
    private readonly repository: Repository<PasswordResetTokenOrmEntity>,
  ) {}

  async create(data: CreatePasswordResetTokenDto): Promise<void> {
    await this.repository.insert(data);
  }

  async findUsable(
    tokenHash: string,
    now: Date,
  ): Promise<PasswordResetToken | null> {
    const row = await this.repository.findOneBy({
      tokenHash,
      usedAt: IsNull(),
      expiresAt: MoreThan(now),
    });
    return row
      ? {
          id: row.id,
          userId: row.userId,
          expiresAt: row.expiresAt,
          usedAt: row.usedAt,
        }
      : null;
  }

  async consume(id: string, now: Date): Promise<boolean> {
    const result = await this.repository.update(
      { id, usedAt: IsNull() },
      { usedAt: now },
    );
    return (result.affected ?? 0) > 0;
  }

  async invalidateForUser(userId: string, now: Date): Promise<void> {
    await this.repository.update({ userId, usedAt: IsNull() }, { usedAt: now });
  }

  countCreatedSince(userId: string, since: Date): Promise<number> {
    return this.repository.countBy({
      userId,
      createdAt: MoreThanOrEqual(since),
    });
  }
}
