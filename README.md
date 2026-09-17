# Conecta U — Backend

Backend de Conecta U (**Iteración 1 · RF1–RF9**): autenticación, perfiles técnicos de colaboradores y registro/gestión de proyectos. Monolito modular en NestJS + TypeORM + PostgreSQL, construido sobre el [template NestJS](../template-nestjs) del equipo (arquitectura por capas, auth JWT y gestión de usuarios ya resueltas).

No implementa IA ni matchmaking (RF10–RF18) — esos módulos quedan como esqueletos vacíos para la Iteración 2/3.

## Qué incluye

- NestJS + TypeScript + TypeORM (PostgreSQL, code-first + migraciones).
- Arquitectura por capas: `domain` (entidades y contratos), `application` (DTOs y casos de uso), `infrastructure` (TypeORM, seguridad), `presentation` (controladores, guards, módulos).
- Autenticación JWT completa: registro, login, refresh token, logout, `/auth/me`, con contraseñas hasheadas (bcrypt, `select: false` en la columna).
- Autorización por rol (`JwtAuthGuard` + `AuthorizationGuard` + decorador `@Authorize`) con los roles del dominio: `LIDER`, `COLABORADOR`, `ADMIN`.
- Perfil técnico del colaborador: datos generales, conocimientos/competencias, experiencia y disponibilidad.
- Registro y gestión de proyectos por el líder (plantilla con resumen, objetivos, habilidades conocidas, semillero/programa).
- Catálogo de menús por rol, para que el frontend arme su navegación a partir de la respuesta de login.
- Filtro global de excepciones (`{ statusCode, message }`), validación automática de DTOs y documentación interactiva en Swagger (`/docs`).
- Esqueletos vacíos de `AiModule` y `MatchmakingModule` (Iteración 2), sin lógica.

## Arquitectura

```
src/
  domain/                  # Entidades y contratos, sin dependencias de frameworks
    entities/               # User, Collaborator, Skill, Experience, Project + tipos de rol/estado
    repositories/           # Interfaces (puertos)
  application/              # Casos de uso y DTOs
    dto/
    use-cases/
  infrastructure/           # Implementaciones concretas (adaptadores)
    database/typeorm/        # Entidades ORM + repositorios TypeORM
    database/data-source.ts  # DataSource para el CLI de migraciones
    security/
  presentation/              # Capa HTTP: controladores, guards, módulos
    controllers/
    guards/
  shared/                    # Utilidades transversales (excepciones, tokens DI)
  migrations/                 # Migraciones de TypeORM
```

Los casos de uso dependen de interfaces (`UserRepository`, `CollaboratorRepository`, `SkillRepository`, `ExperienceRepository`, `ProjectRepository`, `PasswordHasher`, `TokenService`), inyectadas vía tokens en `shared/interfaces/tokens.ts`.

**Modelo de datos:** `User 1—1 Collaborator` (PK compartida: `collaborators.userId` es también su clave primaria, y solo existe fila cuando `role = COLABORADOR`, creada en la misma transacción que el registro) · `Collaborator 1—N Skill` · `Collaborator 1—N Experience` · `User(líder) 1—N Project`. `semillero`/`programa` quedan como texto libre en esta iteración (se normalizan a catálogos en la Iteración 3).

## Endpoints (RF1–RF9)

| Método | Ruta | RF | Rol | Notas |
|---|---|---|---|---|
| POST | `/api/auth/register` | RF1 | público | crea el usuario y, si `role=COLABORADOR`, su perfil de colaborador (transacción) |
| POST | `/api/auth/login` | RF2 | público | devuelve `access_token`, `refresh_token`, `user` |
| POST | `/api/auth/refresh` | — | público | renueva el access token |
| POST | `/api/auth/logout` | — | JWT | |
| GET | `/api/auth/me` | — | JWT | |
| GET | `/api/profiles/me` | RF3 | COLABORADOR | perfil + skills + experiencia |
| PATCH | `/api/profiles/me` | RF3 | COLABORADOR | |
| GET/POST | `/api/profiles/me/skills` | RF4 | COLABORADOR | |
| PATCH/DELETE | `/api/profiles/me/skills/:id` | RF4 | COLABORADOR | solo el dueño del skill |
| POST | `/api/profiles/me/experience` | RF5 | COLABORADOR | |
| PATCH/DELETE | `/api/profiles/me/experience/:id` | RF5 | COLABORADOR | solo el dueño de la experiencia |
| PATCH | `/api/profiles/me/availability` | RF6 | COLABORADOR | |
| POST | `/api/projects` | RF7+RF8 | LIDER | |
| GET | `/api/projects` | RF9 | LIDER | solo sus proyectos |
| GET/PATCH | `/api/projects/:id` | RF9 | LIDER (dueño) | |
| GET | `/api/users`, `/api/users/:id` | — | ADMIN | gestión de usuarios |
| POST/PATCH/DELETE | `/api/users/:id` | — | ADMIN | |
| GET | `/api/roles`, `/api/menu/:role` | — | ADMIN / JWT | catálogos |
| GET | `/api/health` | — | pública | |

Documentación interactiva completa (con "Authorize" para probar endpoints protegidos): `http://localhost:3001/docs`. Ver también [AUTH_TESTING.md](AUTH_TESTING.md).

Para probar cada endpoint individualmente contra local o contra el ambiente deployado, importa la colección de [`postman/`](postman/) (incluye ambientes separados y guarda tokens automáticamente al hacer login).

## Requisitos previos

- Node.js 20 o superior recomendado
- npm 10 o superior recomendado
- PostgreSQL (local o remoto)

## Cómo correr el proyecto

1. Instala dependencias:

```bash
npm install
```

2. Copia `.env.example` a `.env` y ajusta los valores (especialmente `DATABASE_URL` y `JWT_SECRET`):

```bash
cp .env.example .env
```

3. Primer arranque — crea las tablas. Dos opciones:
   - **Rápido para desarrollo:** pon `DB_SYNCHRONIZE=true` en `.env`, arranca la app una vez, y vuelve a ponerlo en `false`.
   - **Con migraciones (recomendado):** con `DATABASE_URL` apuntando a una base vacía, genera y corre la migración inicial:
     ```bash
     npm run migration:generate
     npm run migration:run
     ```

4. Inicia el servidor de desarrollo:

```bash
npm run start:dev
```

5. La API queda disponible en `http://localhost:3001/api`, y la documentación en `http://localhost:3001/docs`.

`synchronize` **nunca** debe ir en `true` en producción — usa siempre migraciones ahí.

## Scripts disponibles

- `npm run start:dev`: ejecuta la app en modo desarrollo (watch).
- `npm run build`: genera la compilación de producción.
- `npm run start:prod`: levanta la app compilada.
- `npm run lint`: ejecuta ESLint con `--fix`.
- `npm run test`: ejecuta pruebas unitarias.
- `npm run test:cov`: pruebas unitarias con reporte de cobertura.
- `npm run test:e2e`: pruebas end-to-end.
- `npm run migration:generate`: genera una migración a partir de los cambios en las entidades.
- `npm run migration:run` / `migration:revert`: aplica o revierte migraciones.

## Guardarraíles de esta iteración

- No hay lógica de IA, matchmaking, recomendaciones, estadísticas ni reportes (RF10–RF18) — `AiModule` y `MatchmakingModule` son módulos vacíos.
- `semillero`/`programa` van como texto libre, no como tablas normalizadas.
- `passwordHash` nunca se expone en ninguna respuesta (columna `select: false`, y los casos de uso solo devuelven los campos públicos del usuario).

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
