import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import {
  INVITATION_STATUSES,
  type InvitationEntity,
  type InvitationStatus,
} from '../../../domain/entities/invitation';
import type {
  InvitationRepository,
  NewInvitation,
} from '../../../domain/repositories/invitation.repository.interface';
import { InvitationOrmEntity } from './invitation.orm-entity';

function toEntity(row: InvitationOrmEntity): InvitationEntity {
  return {
    id: row.id,
    projectId: row.projectId,
    collaboratorId: row.collaboratorId,
    requiredProfileId: row.requiredProfileId,
    sentById: row.sentById,
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    profileName: row.profileName,
    status: row.status as InvitationStatus,
    errorMessage: row.errorMessage,
    sentAt: row.sentAt,
  };
}

@Injectable()
export class TypeOrmInvitationRepository implements InvitationRepository {
  constructor(
    @InjectRepository(InvitationOrmEntity)
    private readonly repository: Repository<InvitationOrmEntity>,
  ) {}

  async createMany(rows: NewInvitation[]): Promise<InvitationEntity[]> {
    if (rows.length === 0) return [];
    const saved = await this.repository.save(
      rows.map((row) => this.repository.create(row)),
    );
    return saved.map(toEntity);
  }

  async findByProject(projectId: string): Promise<InvitationEntity[]> {
    const rows = await this.repository.find({
      where: { projectId },
      order: { sentAt: 'DESC' },
    });
    return rows.map(toEntity);
  }

  async findRecentRecipientIds(
    projectId: string,
    since: Date,
  ): Promise<string[]> {
    const rows = await this.repository.find({
      select: { collaboratorId: true },
      where: { projectId, status: 'ENVIADA', sentAt: MoreThanOrEqual(since) },
    });
    return rows
      .map((row) => row.collaboratorId)
      .filter((id): id is string => id !== null);
  }

  async countByStatus(): Promise<Record<InvitationStatus, number>> {
    const rows: { status: InvitationStatus; count: string }[] =
      await this.repository
        .createQueryBuilder('invitation')
        .select('invitation.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('invitation.status')
        .getRawMany();
    const counts = Object.fromEntries(
      INVITATION_STATUSES.map((status) => [status, 0]),
    ) as Record<InvitationStatus, number>;
    for (const row of rows) counts[row.status] = Number(row.count);
    return counts;
  }
}
