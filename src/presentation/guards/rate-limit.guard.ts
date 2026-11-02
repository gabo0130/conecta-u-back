import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export interface RateLimitOptions {
  /** Solicitudes permitidas por IP dentro de la ventana. */
  limit: number;
  windowMs: number;
}

const RATE_LIMIT = 'rateLimit';
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT, options);

export const TOO_MANY_REQUESTS =
  'Hiciste demasiadas solicitudes seguidas. Espera unos minutos e intenta de nuevo.';

/**
 * Límite simple por IP y ruta, en memoria (una instancia en Render). Frena el abuso de los
 * endpoints públicos sensibles (recuperar contraseña). Detrás de un proxy, `trust proxy` debe
 * estar activo para que `request.ip` sea la IP real (ver `main.ts`).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT,
      context.getHandler(),
    );
    if (!options) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const route = (request.route as { path?: string } | undefined)?.path;
    const key = `${request.method}:${route ?? request.path}:${request.ip ?? 'desconocida'}`;
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter(
      (time) => now - time < options.windowMs,
    );
    if (recent.length >= options.limit) {
      this.hits.set(key, recent);
      throw new HttpException(
        { message: TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.hits.set(key, recent);
    this.forgetOld(now, options.windowMs);
    return true;
  }

  /** Evita que el mapa crezca sin límite con IPs que ya no vuelven. */
  private forgetOld(now: number, windowMs: number): void {
    if (this.hits.size < 5_000) return;
    for (const [key, times] of this.hits) {
      if (times.every((time) => now - time >= windowMs)) this.hits.delete(key);
    }
  }
}
