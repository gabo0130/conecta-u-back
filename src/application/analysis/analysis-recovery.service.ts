import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import {
  ANALYSIS_TIMEOUTS,
  PROJECT_ANALYSIS_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import type { AnalysisTimeouts } from './analysis-timeouts';

/** Cada cuánto se buscan análisis interrumpidos mientras el servidor está arriba. */
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Recupera análisis interrumpidos (RNF6): si el servidor se reinicia a mitad de un análisis,
 * el PENDIENTE pasa a ERROR y el proyecto deja `EN_ANALISIS`. Corre al arrancar, cada minuto
 * y cuando alguien consulta el análisis de un proyecto. Nunca lanza: un fallo solo se registra.
 */
@Injectable()
export class AnalysisRecoveryService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger: ReturnType<AppLoggerService['forContext']>;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(PROJECT_ANALYSIS_REPOSITORY)
    private readonly analysisRepository: ProjectAnalysisRepository,
    @Inject(ANALYSIS_TIMEOUTS) private readonly timeouts: AnalysisTimeouts,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(AnalysisRecoveryService.name);
  }

  onApplicationBootstrap(): void {
    void this.recover();
    this.timer = setInterval(() => void this.recover(), SWEEP_INTERVAL_MS);
    // El barrido no debe mantener vivo el proceso (tests, cierre ordenado).
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Con `projectId`, solo ese proyecto (antes de mostrar o pedir su análisis). */
  async recover(projectId?: string): Promise<void> {
    try {
      const recovered = await this.analysisRepository.recoverInterrupted(
        new Date(Date.now() - this.timeouts.staleAfterMs),
        projectId,
      );
      if (recovered > 0) {
        this.logger.warn('Se cerraron análisis interrumpidos', {
          method: 'recover',
          recovered,
          projectId,
        });
      }
    } catch (error) {
      this.logger.error(
        'No se pudieron recuperar análisis interrumpidos',
        error,
        {
          method: 'recover',
          projectId,
        },
      );
    }
  }
}
