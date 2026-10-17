import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import type { ProjectAnalysisEntity } from '../../../domain/entities/project-analysis.entity';
import type { RequiredProfileEntity } from '../../../domain/entities/required-profile.entity';
import type {
  AnalysisSlotLimits,
  ClaimAnalysisResult,
  CompleteProjectAnalysisDto,
  CreateProjectAnalysisDto,
  ProjectAnalysisRepository,
} from '../../../domain/repositories/project-analysis.repository.interface';
import type {
  Page,
  PageParams,
} from '../../../shared/pagination/pagination.util';
import { toSkip } from '../../../shared/pagination/pagination.util';
import { embeddingColumns } from './mappers/embedding-columns';
import {
  toProjectAnalysisEntity,
  toRequiredProfileEntity,
} from './mappers/project-analysis.mapper';
import { ProjectAnalysisOrmEntity } from './project-analysis.orm-entity';
import { ProjectOrmEntity } from './project.orm-entity';
import { RequiredProfileOrmEntity } from './required-profile.orm-entity';

const INTERRUPTED_MESSAGE = 'El análisis se interrumpió antes de terminar.';

@Injectable()
export class TypeOrmProjectAnalysisRepository implements ProjectAnalysisRepository {
  constructor(
    @InjectRepository(ProjectAnalysisOrmEntity)
    private readonly repository: Repository<ProjectAnalysisOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async claim(
    data: CreateProjectAnalysisDto,
    limits: AnalysisSlotLimits,
  ): Promise<ClaimAnalysisResult> {
    return this.dataSource.transaction(async (manager) => {
      // Serializa las peticiones del mismo proyecto hasta el fin de la transacción.
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`project-analysis:${data.projectId}`],
      );

      const inProgress = await manager.count(ProjectAnalysisOrmEntity, {
        where: { projectId: data.projectId, status: 'PENDIENTE' },
      });
      if (inProgress > 0) return { status: 'IN_PROGRESS' };

      const today = await manager.count(ProjectAnalysisOrmEntity, {
        where: {
          projectId: data.projectId,
          createdAt: MoreThanOrEqual(limits.dailySince),
        },
      });
      if (today >= limits.maxPerDay) return { status: 'DAILY_LIMIT' };

      const analysis = await manager.save(
        manager.create(ProjectAnalysisOrmEntity, {
          projectId: data.projectId,
          requestedById: data.requestedById,
          status: 'PENDIENTE',
          provider: data.provider,
          model: data.model,
          promptVersion: data.promptVersion,
          input: data.input,
        }),
      );
      return { status: 'CLAIMED', analysis: toProjectAnalysisEntity(analysis) };
    });
  }

  async complete(
    id: string,
    data: CompleteProjectAnalysisDto,
  ): Promise<{
    analysis: ProjectAnalysisEntity;
    profiles: RequiredProfileEntity[];
  } | null> {
    return this.dataSource.transaction(async (manager) => {
      // Bloquea la fila: si la recuperación la cerró mientras la IA respondía, no se pisa.
      const analysis = await manager.findOne(ProjectAnalysisOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (analysis?.status !== 'PENDIENTE') return null;
      Object.assign(analysis, {
        status: 'COMPLETADO',
        ...(data.model ? { model: data.model } : {}),
        rawOutput: data.rawOutput,
        summary: data.summary,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        durationMs: data.durationMs,
        errorMessage: null,
        completedAt: new Date(),
      });
      const saved = await manager.save(analysis);
      await manager.update(
        ProjectOrmEntity,
        { id: saved.projectId },
        { status: 'ANALIZADO' },
      );

      const profiles = data.profiles.map((profile) =>
        manager.create(RequiredProfileOrmEntity, {
          projectId: saved.projectId,
          analysisId: saved.id,
          source: 'IA',
          name: profile.name,
          description: profile.description,
          justification: profile.justification,
          quantity: profile.quantity,
          priority: profile.priority,
          minWeeklyHours: profile.minWeeklyHours,
          position: profile.position,
          ...embeddingColumns(profile.embedding),
          active: true,
          skills: profile.skills.map((skill) => ({
            skillId: skill.skillId,
            rawName: skill.rawName,
            type: skill.type,
            minLevel: skill.minLevel,
            importance: skill.importance,
          })),
        }),
      );
      await manager.save(profiles);

      // Se vuelven a leer con el nombre canónico de cada habilidad del catálogo.
      const savedProfiles = await manager.find(RequiredProfileOrmEntity, {
        where: { analysisId: saved.id },
        relations: { skills: { skill: true } },
        order: { position: 'ASC' },
      });

      return {
        analysis: toProjectAnalysisEntity(saved),
        profiles: savedProfiles.map(toRequiredProfileEntity),
      };
    });
  }

  async fail(
    id: string,
    errorMessage: string,
    durationMs: number,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      // Condicional: un análisis que ya terminó (o que la recuperación cerró) no se pisa.
      const result = await manager
        .createQueryBuilder()
        .update(ProjectAnalysisOrmEntity)
        .set({
          status: 'ERROR',
          errorMessage,
          durationMs,
          completedAt: () => 'now()',
        })
        .where('id = :id AND status = :pending', { id, pending: 'PENDIENTE' })
        .returning('"projectId"')
        .execute();
      const [failed] = result.raw as { projectId: string }[];
      if (!failed) return false;
      await this.restoreProjectStatus(manager, failed.projectId);
      return true;
    });
  }

  async recoverInterrupted(
    staleBefore: Date,
    projectId?: string,
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const interrupted = manager
        .createQueryBuilder()
        .update(ProjectAnalysisOrmEntity)
        .set({
          status: 'ERROR',
          errorMessage: INTERRUPTED_MESSAGE,
          completedAt: () => 'now()',
        })
        .where('status = :pending', { pending: 'PENDIENTE' })
        .andWhere('"createdAt" < :staleBefore', { staleBefore });
      if (projectId)
        interrupted.andWhere('"projectId" = :projectId', { projectId });
      const { affected } = await interrupted.execute();

      await this.restoreProjectStatus(manager, projectId);
      return affected ?? 0;
    });
  }

  /**
   * Única regla del estado tras cerrar un análisis: un proyecto EN_ANALISIS sin análisis vivo
   * vuelve a ANALIZADO si tiene uno completado y a BORRADOR si no.
   */
  private async restoreProjectStatus(
    manager: EntityManager,
    projectId?: string,
  ): Promise<void> {
    await this.restoreStuckProjects(manager, 'ANALIZADO', 'EXISTS', projectId);
    await this.restoreStuckProjects(
      manager,
      'BORRADOR',
      'NOT EXISTS',
      projectId,
    );
  }

  private async restoreStuckProjects(
    manager: EntityManager,
    status: 'ANALIZADO' | 'BORRADOR',
    completed: 'EXISTS' | 'NOT EXISTS',
    projectId?: string,
  ): Promise<void> {
    const query = manager
      .createQueryBuilder()
      .update(ProjectOrmEntity)
      .set({ status })
      .where('status = :inAnalysis', { inAnalysis: 'EN_ANALISIS' })
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM project_analyses a WHERE a."projectId" = projects.id AND a.status = 'PENDIENTE')`,
      )
      .andWhere(
        `${completed} (SELECT 1 FROM project_analyses a WHERE a."projectId" = projects.id AND a.status = 'COMPLETADO')`,
      );
    if (projectId) query.andWhere('id = :projectId', { projectId });
    await query.execute();
  }

  async findById(id: string): Promise<ProjectAnalysisEntity | null> {
    const analysis = await this.repository.findOne({ where: { id } });
    return analysis ? toProjectAnalysisEntity(analysis) : null;
  }

  async findLatestCompleted(
    projectId: string,
  ): Promise<ProjectAnalysisEntity | null> {
    const analysis = await this.repository.findOne({
      where: { projectId, status: 'COMPLETADO' },
      order: { createdAt: 'DESC' },
    });
    return analysis ? toProjectAnalysisEntity(analysis) : null;
  }

  async findByProjectId(
    projectId: string,
    params: PageParams,
  ): Promise<Page<ProjectAnalysisEntity>> {
    const [analyses, total] = await this.repository.findAndCount({
      where: { projectId },
      order: { createdAt: 'DESC' },
      skip: toSkip(params.page, params.pageSize),
      take: params.pageSize,
    });
    return { items: analyses.map(toProjectAnalysisEntity), total };
  }
}
