import type { AnalysisStatus } from './analysis-status.type';

export interface ProjectAnalysisProps {
  id: string;
  projectId: string;
  requestedById: string | null;
  status: AnalysisStatus;
  provider: string;
  model: string;
  /** Versión del prompt con el que se pidió (RNF8: trazabilidad). */
  promptVersion: string;
  /** Lo que se envió a la IA, sin datos personales. */
  input: Record<string, unknown>;
  inputTokens: number | null;
  outputTokens: number | null;
  rawOutput: unknown;
  summary: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

/** Una corrida de análisis de un proyecto con IA (RF12). Se conserva todo el historial. */
export class ProjectAnalysisEntity implements ProjectAnalysisProps {
  readonly id: string;
  readonly projectId: string;
  readonly requestedById: string | null;
  readonly status: AnalysisStatus;
  readonly provider: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly input: Record<string, unknown>;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly rawOutput: unknown;
  readonly summary: string | null;
  readonly errorMessage: string | null;
  readonly durationMs: number | null;
  readonly createdAt: Date;
  readonly completedAt: Date | null;

  constructor(props: ProjectAnalysisProps) {
    Object.assign(this, props);
  }
}
