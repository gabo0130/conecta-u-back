import {
  Injectable,
  LoggerService as NestLoggerService,
  LogLevel as NestLogLevel,
} from '@nestjs/common';
import { LogLevel } from './log-level.type';
import { RequestContext } from './request-context';

// Nest usa 'log'/'fatal' donde nosotros usamos 'info'/'error'. Se traduce
// solo en el borde donde Nest llama setLogLevels(); el resto del servicio
// solo conoce nuestro propio LogLevel.
const NEST_TO_APP_LEVEL: Record<NestLogLevel, LogLevel> = {
  log: 'info',
  fatal: 'error',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
  verbose: 'verbose',
};

export interface LogMeta {
  method?: string;
  [key: string]: unknown;
}

export interface ContextLogger {
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  verbose(message: string, meta?: LogMeta): void;
  error(message: string, error?: unknown, meta?: LogMeta): void;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  traceId: string;
  context?: string;
  method?: string;
  message: string;
  meta?: Record<string, unknown>;
  stack?: string;
}

/**
 * Logger transversal de la aplicación.
 *
 * - Compatible con NestLoggerService (log/error/warn/debug/verbose), para
 *   poder reemplazar el logger interno de Nest vía `app.useLogger()`.
 * - `forContext(NombreDeClase.name)` devuelve un logger con nombre de clase
 *   y método por llamada, para uso en servicios/casos de uso/controladores.
 *
 * Uso típico dentro de una clase:
 *   private readonly logger = this.appLogger.forContext(MiClase.name);
 *   this.logger.info('mensaje', { method: 'miMetodo', extra: 'dato' });
 */
@Injectable()
export class AppLoggerService implements NestLoggerService {
  private enabledLevels = new Set<LogLevel>([
    'error',
    'warn',
    'info',
    'debug',
    'verbose',
  ]);

  forContext(context: string): ContextLogger {
    return {
      info: (message, meta) => this.write('info', message, context, meta),
      warn: (message, meta) => this.write('warn', message, context, meta),
      debug: (message, meta) => this.write('debug', message, context, meta),
      verbose: (message, meta) => this.write('verbose', message, context, meta),
      error: (message, error, meta) =>
        this.write('error', message, context, meta, error),
    };
  }

  // --- Interfaz LoggerService de Nest (para app.useLogger()) ---

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write(
      'info',
      this.stringify(message),
      this.pickContext(optionalParams),
    );
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const [trace, context] = this.splitErrorParams(optionalParams);
    this.write('error', this.stringify(message), context, undefined, trace);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write(
      'warn',
      this.stringify(message),
      this.pickContext(optionalParams),
    );
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write(
      'debug',
      this.stringify(message),
      this.pickContext(optionalParams),
    );
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write(
      'verbose',
      this.stringify(message),
      this.pickContext(optionalParams),
    );
  }

  setLogLevels(levels: NestLogLevel[]): void {
    this.enabledLevels = new Set(
      levels.map((level) => NEST_TO_APP_LEVEL[level]),
    );
  }

  // --- internos ---

  private write(
    level: LogLevel,
    message: string,
    context?: string,
    meta?: LogMeta,
    error?: unknown,
  ): void {
    if (!this.enabledLevels.has(level)) {
      return;
    }

    const { method, ...rest } = meta ?? {};

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      traceId: RequestContext.traceId ?? 'no-trace-id',
      context,
      method,
      message,
      meta: Object.keys(rest).length > 0 ? rest : undefined,
      stack: this.extractStack(error),
    };

    const line = JSON.stringify(entry);

    if (level === 'error') {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  private extractStack(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    if (typeof error === 'string') {
      return error;
    }
    return undefined;
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private pickContext(optionalParams: unknown[]): string | undefined {
    const last = optionalParams[optionalParams.length - 1];
    return typeof last === 'string' ? last : undefined;
  }

  private splitErrorParams(
    optionalParams: unknown[],
  ): [string | undefined, string | undefined] {
    // Nest llama error(message, trace?, context?)
    if (optionalParams.length >= 2) {
      const [trace, context] = optionalParams;
      return [
        typeof trace === 'string' ? trace : undefined,
        typeof context === 'string' ? context : undefined,
      ];
    }
    if (optionalParams.length === 1) {
      const [single] = optionalParams;
      return [typeof single === 'string' ? single : undefined, undefined];
    }
    return [undefined, undefined];
  }
}
