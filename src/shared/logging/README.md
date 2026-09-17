# Logging transversal

Servicio de logging estructurado con seguimiento de transacciones por petición.

## Qué resuelve

- **Trazabilidad por petición**: cada request HTTP recibe un `traceId` (reusa `X-Request-Id` si el cliente lo manda, o genera uno nuevo) propagado automáticamente a través de toda la cadena async de esa petición — controller → use-case → repositorio — vía `AsyncLocalStorage`, sin pasar el id a mano por cada función. El mismo id se devuelve en la respuesta como header `X-Request-Id`, para correlacionar con el cliente.
- **Niveles**: `error`, `warn`, `info`, `debug`, `verbose`.
- **Rastreo por clase y método**: cada línea de log incluye `context` (la clase que logueó) y, opcionalmente, `method`.
- **Formato**: una línea JSON por log — parseable por cualquier agregador de logs (Render, Datadog, etc.) y suficientemente legible en la consola.

Ya está instalado a nivel de aplicación: reemplaza el logger interno de Nest (`app.useLogger()` en `main.ts`) y el middleware que arma el `traceId` corre en todas las rutas (`AppModule.configure()`). Verificado en vivo: los logs de arranque de Nest y el `X-Request-Id` en la respuesta ya funcionan.

**No se conectó dentro de ningún caso de uso, controlador o filtro existente** — la infraestructura está lista, pero adoptarla en el código de negocio (por ejemplo, en `HttpExceptionFilter` o en los use-cases) queda a decisión tuya.

## Cómo usarlo en una clase

```ts
import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../shared/logging/logger.service';

@Injectable()
export class LoginUseCase {
  private readonly logger = this.appLogger.forContext(LoginUseCase.name);

  constructor(
    // ...tus otras dependencias
    private readonly appLogger: AppLoggerService,
  ) {}

  async execute(loginDto: LoginDto) {
    this.logger.info('Intento de login', { method: 'execute', email: loginDto.email });

    try {
      // ...lógica
    } catch (error) {
      this.logger.error('Login falló', error, { method: 'execute' });
      throw error;
    }
  }
}
```

Como `LoggingModule` es `@Global()`, no hace falta importarlo en cada módulo de feature — `AppLoggerService` se puede inyectar directo.

## Formato de cada línea

```json
{
  "timestamp": "2026-09-17T21:23:45.123Z",
  "level": "error",
  "traceId": "7f4f12d4-d2a3-4282-b0a6-753c653c67b2",
  "context": "LoginUseCase",
  "method": "execute",
  "message": "Login falló",
  "meta": { "email": "ana@ufps.edu.co" },
  "stack": "UnauthorizedException: Credenciales inválidas\n    at ..."
}
```

`traceId` es `"no-trace-id"` para logs que ocurren fuera de una petición HTTP (arranque de la app, jobs, etc.).
