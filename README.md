# Conecta U — Backend

Backend de Conecta U (**Iteración 1 · RF1–RF11, RF23–RF24**): autenticación, catálogos (programas y habilidades), perfil técnico del colaborador (independiente del usuario), proyectos por tipo/categoría con entregables, e importación de colaboradores desde Excel. Monolito modular en NestJS + TypeORM + PostgreSQL, construido sobre el [template NestJS](../template-nestjs) del equipo (arquitectura por capas, auth JWT y gestión de usuarios ya resueltas).

No implementa IA ni matchmaking (RF12–RF17), ni dashboard/gestión de personas/convocatorias (RF18–RF22, RF25–RF26) — esos módulos quedan como esqueletos vacíos o pendientes para la Iteración 2/3.

## Qué incluye

- NestJS + TypeScript + TypeORM (PostgreSQL, code-first + migraciones).
- Arquitectura por capas: `domain` (entidades y contratos), `application` (DTOs y casos de uso), `infrastructure` (TypeORM, seguridad), `presentation` (controladores, guards, módulos).
- Autenticación JWT completa: registro (con vínculo automático al colaborador), login (rechaza usuarios inactivos), refresh token, logout, `/auth/me`, con contraseñas hasheadas (bcrypt, `select: false` en la columna). El registro público solo admite `LIDER`/`COLABORADOR` — `ADMIN` no es un rol autoregistrable.
- Autorización por rol (`JwtAuthGuard` + `AuthorizationGuard` + decorador `@Authorize`) con los roles del dominio: `LIDER`, `COLABORADOR`, `ADMIN`.
- **Colaborador ≠ Usuario:** `Collaborator` tiene `id` propio y `userId` opcional — una persona puede existir sin cuenta (creada por importación) y un `LIDER` también puede tener su propio perfil técnico (`POST /collaborators/me`).
- Perfil técnico del colaborador: datos generales, habilidades del catálogo (con nivel, meses de experiencia y último uso), experiencia estructurada (tipo, fechas, dedicación, nivel, tecnologías) y disponibilidad.
- Catálogos: programas, habilidades (con sinónimos, categoría y estado activa/pendiente — búsqueda y propuesta de nuevas), tipos y categorías de proyecto.
- Registro y gestión de proyectos por el líder: tipo (con plantilla dinámica validada por campo), categoría, habilidades conocidas y entregables.
- Importación de colaboradores desde Excel (ADMIN): plantilla descargable, valida y resuelve catálogos, informa creados/rechazados/advertencias.
- Catálogo de menús por rol, para que el frontend arme su navegación a partir de la respuesta de login.
- Filtro global de excepciones (`{ statusCode, message }`), validación automática de DTOs y documentación interactiva en Swagger (`/docs`).
- Logging estructurado con `traceId` por petición (ver [`src/shared/logging/README.md`](src/shared/logging/README.md)).
- Esqueletos vacíos de `AiModule` y `MatchmakingModule` (Iteración 2), sin lógica.

## Arquitectura

```
src/
  domain/                  # Entidades y contratos, sin dependencias de frameworks
    entities/               # User, Collaborator, Program, Skill, CollaboratorSkill, Experience,
                             # Project, ProjectType, ProjectCategory, Deliverable + tipos de rol/estado
    repositories/           # Interfaces (puertos)
  application/              # Casos de uso y DTOs
    dto/
    use-cases/
  infrastructure/           # Implementaciones concretas (adaptadores)
    database/typeorm/        # Entidades ORM + repositorios TypeORM
    database/data-source.ts  # DataSource para el CLI de migraciones
    database/seed.ts         # Datos de prueba (catálogos, personas, proyectos)
    security/
  presentation/              # Capa HTTP: controladores, guards, módulos
    controllers/
    guards/
  shared/                    # Utilidades transversales (excepciones, tokens DI, logging, import)
  migrations/                 # Migraciones de TypeORM
```

Los casos de uso dependen de interfaces (`UserRepository`, `CollaboratorRepository`, `CollaboratorSkillRepository`, `SkillRepository`, `ExperienceRepository`, `ProgramRepository`, `ProjectRepository`, `ProjectTypeRepository`, `ProjectCategoryRepository`, `PasswordHasher`, `TokenService`), inyectadas vía tokens en `shared/interfaces/tokens.ts`.

**Modelo de datos:** `User 1—1 Collaborator` (`Collaborator` con `id` propio; `userId` nullable y único — una persona puede no tener cuenta) · `Collaborator N—M Skill` vía `CollaboratorSkill` (nivel, meses, último uso) · `Collaborator 1—N Experience` (M—M con `Skill` como tecnologías) · `User(líder) 1—N Project` · `Project N—1 ProjectType`, `N—1 ProjectCategory`, `N—M Skill` (conocidas), `1—N Deliverable`. `programs` y `skills` son catálogos independientes referenciados por FK.

## Endpoints (RF1–RF17, RF23–RF24)

| Método | Ruta | RF | Rol | Notas |
|---|---|---|---|---|
| POST | `/api/auth/register` | RF1 | público | `LIDER`\|`COLABORADOR`; v2.1: toda cuenta trae `collaborator` con documento, teléfono y nacionalidad; vincula por documento, luego por correo, o crea la persona; 409 si el documento ya tiene cuenta |
| POST | `/api/auth/login` | RF2 | público | rechaza usuarios inactivos; devuelve `access_token`, `refresh_token`, `user` |
| POST | `/api/auth/refresh` | — | público | renueva el access token |
| POST | `/api/auth/logout` | — | JWT | |
| GET | `/api/auth/me` | — | JWT | |
| POST | `/api/collaborators/me` | RF3 | cuenta sin persona | crea/vincula el perfil propio (con identificación v2.1) |
| GET/PATCH | `/api/collaborators/me` | RF3 | COLABORADOR, LIDER con perfil | incluye identificación; el PATCH corrige teléfono, nacionalidad, correo alterno y código (el documento solo lo cambia el ADMIN) |
| GET/POST | `/api/collaborators/me/skills` | RF4 | ídem | contra el catálogo de habilidades |
| PATCH/DELETE | `/api/collaborators/me/skills/:id` | RF4 | ídem | solo el dueño |
| POST | `/api/collaborators/me/experience` | RF5 | ídem | respuesta con `durationMonths` |
| PATCH/DELETE | `/api/collaborators/me/experience/:id` | RF5 | ídem | solo el dueño |
| PATCH | `/api/collaborators/me/availability` | RF6 | ídem | |
| GET | `/api/catalogs/programs` | RF1, RF3 | público | |
| GET | `/api/catalogs/skills?q=&type=` | RF4, RF5, RF8 | JWT | búsqueda con sinónimos |
| POST | `/api/catalogs/skills` | RF4 | JWT | propone una habilidad (`status: PENDIENTE`) |
| GET | `/api/catalogs/project-types`, `/api/catalogs/project-categories` | RF7, RF9 | LIDER | |
| POST | `/api/projects` | RF7–RF10 | LIDER, ADMIN | valida `typeData` contra la plantilla del tipo (incluye `tags` y `currency`, v2.1); el ADMIN envía `leaderId` (líder activo) y el proyecto queda de ese líder (A5) |
| GET | `/api/projects` | RF11 | LIDER | solo sus proyectos |
| GET/PATCH | `/api/projects/:id` | RF11 | LIDER (dueño) | |
| POST | `/api/projects/:id/analysis` | RF12 | LIDER (dueño) | análisis con IA, síncrono (15–45 s con Gemini); 409 en curso o 5/día, 422 proyecto incompleto, 503 IA caída |
| GET | `/api/projects/:id/analysis` | RF13–RF14 | LIDER (dueño), ADMIN | último análisis con perfiles, justificación y `outdated` |
| GET | `/api/projects/:id/analyses` | RNF8 | LIDER (dueño), ADMIN | historial paginado (modelo, versión del prompt, tokens) |
| POST/PATCH | `/api/projects/:id/required-profiles[/:profileId]` | RF13 | LIDER (dueño) | agrega un perfil `MANUAL`, edita uno o lo descarta con `active:false` |
| POST | `/api/projects/:id/recommendations` | RF15–RF16 | LIDER (dueño) | calcula y guarda las mejores personas por perfil; reemplaza las anteriores; 409 sin análisis |
| GET | `/api/projects/:id/recommendations?profileId=&includeUnavailable=` | RF16 | LIDER (dueño), ADMIN | lista ordenada por perfil; sin correo ni teléfono |
| GET | `/api/projects/:id/recommendations/:recommendationId` | RF17 | LIDER (dueño), ADMIN | desglose del puntaje (`breakdown`) |
| POST | `/api/admin/embeddings/rebuild` | RF15 | ADMIN | recalcula embeddings de personas y de perfiles requeridos; `{force?, limit?}` |
| PATCH | `/api/admin/collaborators/:id` | RF21 | ADMIN | v2.1: corrige identificación y contacto, incluido el documento (409 si es de otra persona) |
| GET | `/api/admin/import/collaborators/template` | RF23 | ADMIN | descarga la plantilla .xlsx (v2.1: columnas de identificación) |
| POST | `/api/admin/import/collaborators` | RF23–RF24 | ADMIN | multipart .xlsx, máx. 5 MB |
| GET | `/api/users`, `/api/users/:id` | — | ADMIN | gestión de usuarios |
| POST/PATCH/DELETE | `/api/users/:id` | — | ADMIN | |
| GET | `/api/roles`, `/api/menu/:role` | — | ADMIN / JWT | catálogos |
| GET | `/api/health` | — | pública | |

Documentación interactiva completa (con "Authorize" para probar endpoints protegidos): `http://localhost:3001/docs`. Ver también [AUTH_TESTING.md](AUTH_TESTING.md).

Para probar cada endpoint individualmente contra local o contra el ambiente deployado, importa la colección de [`postman/`](postman/) (incluye ambientes separados, catálogos, colaboradores, proyectos e importación, y guarda tokens/ids automáticamente al hacer login o crear recursos).

## Requisitos previos

- Node.js 20 o superior recomendado
- npm 10 o superior recomendado
- PostgreSQL (local o remoto)

## Cómo correr el proyecto

1. Instala dependencias:

```bash
npm install
```

2. Copia `.env.example` a `.env` y ajusta los valores (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). `JWT_SECRET` es obligatorio: sin él la API no arranca (no hay secreto por defecto). En producción el seed también exige `ADMIN_PASSWORD`:

```bash
cp .env.example .env
```

> **Ajustes v2.1 (cliente, 19/10/2026).** Cada persona tiene `documentType` (`CC`, `TI`, `CE`, `PPT`, `PA`) + `documentNumber` únicos (índice parcial; la PK sigue siendo el uuid), `phone`, `nationality`, `alternateEmail` e `institutionalCode` (migración `AddPersonIdentification`). En la base son `NULL` para las personas anteriores; los DTO de registro, alta de usuario, perfil propio e importación los exigen. Solo los ven la propia persona y el ADMIN (`identificationComplete` marca a quien le faltan); nunca salen en recomendaciones ni en vistas del líder. La plantilla Excel agrega `tipo_documento`, `numero_documento`, `telefono`, `nacionalidad`, `correo_alterno` y `codigo`; las hojas Habilidades y Experiencia se asocian por `numero_documento` o, si está vacío, por `correo`. Contrato: [`notes/ajustes-cliente-v2.1.md`](notes/ajustes-cliente-v2.1.md).

> **Correo de bienvenida.** Al crear una cuenta (registro propio o alta por el ADMIN) se envía un correo según el rol. Se configura con `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` y `APP_URL` (enlace del botón). Sin `SMTP_HOST` la API funciona igual y solo registra en el log que no se envió. Un fallo del SMTP nunca hace fallar el registro.

> **Análisis con IA (Iteración 2).** `POST /projects/:id/analysis` (líder dueño) pide el análisis; `GET /projects/:id/analysis` devuelve el último completado con sus perfiles y `GET /projects/:id/analyses` el historial (líder dueño o ADMIN). `AI_PROVIDER=fake` (por defecto) usa adaptadores deterministas sin red; `AI_PROVIDER=gemini` exige `GEMINI_API_KEY` y usa `GEMINI_MODEL` (`gemini-3.8-flash`; `gemini-2.5-flash` ya no está disponible para llaves nuevas), `GEMINI_EMBEDDING_MODEL`, `EMBEDDING_DIM` (768) y `AI_TIMEOUT_MS` (55000: presupuesto **total** del análisis, repartido entre las llamadas a Gemini, sus reintentos ante 429/5xx, el modelo de respaldo y los embeddings) y `EMBEDDING_TIMEOUT_MS` (10000: tope de cada cálculo de embeddings). Si el modelo principal sigue saturado tras los reintentos y quedan al menos 8 s, el análisis se intenta una vez con `GEMINI_FALLBACK_MODEL` (`gemini-3.5-flash-lite` por defecto; vacío lo desactiva) y el análisis guarda en `model` el modelo que respondió. El front debe esperar hasta 60 s en `POST …/analysis`. Contrato completo con ejemplos: [`notes/backend-iteracion-2.md`](notes/backend-iteracion-2.md) §12. La migración `AddAnalysisAndMatchmaking` instala la extensión `vector` de Postgres (pgvector). Máximo 5 análisis por proyecto al día y uno en curso a la vez. Un análisis que quedó `PENDIENTE` más de `AI_TIMEOUT_MS` + 60 s (p. ej. por un reinicio del servidor) se cierra como `ERROR` y el proyecto vuelve a `BORRADOR`/`ANALIZADO`: al arrancar, cada minuto y al consultar el análisis. Cada embedding guarda el modelo que lo generó (`embeddingModel`, migración `AddEmbeddingModel`); los de otro modelo se ignoran y se regeneran.

3. Corre las migraciones:

```bash
npm run migration:run
```

> ⚠️ **La migración `RestructureCollaboratorAndProjectModel` requiere que `users`, `collaborators`, `skills`, `experiences` y `projects` estén vacías** y lo verifica antes de tocar el esquema: si alguna tiene filas, falla con un mensaje que nombra la tabla. Además es **irreversible**: su `down()` lanza un error a propósito, así que `migration:revert` no la deshace (restaura desde un respaldo). Agrega columnas `NOT NULL` (p. ej. `skills.normalizedName`, `collaborators.programId/personType/firstName/lastName`, `projects.typeId/categoryId`, `experiences.type/role/startDate/weeklyHours/level`) que no existían en el modelo anterior, así que no hay un valor por el que rellenarlas automáticamente en filas viejas.
>
> Si `migration:run` falla con `La migración al modelo v2.0 requiere la tabla "…" vacía`, es porque esas tablas ya tenían filas (por ejemplo, en un entorno compartido como el Neon de `.env`). La migración corre dentro de una transacción, así que un fallo hace rollback completo — no deja el esquema a medias. Antes de reintentar:
> 1. Confirma que los datos existentes son descartables (datos de prueba, no usuarios reales de producción).
> 2. Vacíalas: `TRUNCATE TABLE users, collaborators, skills, experiences, projects CASCADE;`
> 3. Corre `npm run migration:run` de nuevo y luego `npm run seed`.
>
> Si los datos **sí** hay que conservarlos, no uses este atajo: hace falta escribir una migración que rellene cada columna nueva con valores reales (programa, tipo de persona, tipo/categoría de proyecto, etc.), decisión por fila que no se puede automatizar.

4. Pobla catálogos y datos de prueba:

```bash
npm run seed
```

5. Inicia el servidor de desarrollo:

```bash
npm run start:dev
```

6. La API queda disponible en `http://localhost:3001/api`, y la documentación en `http://localhost:3001/docs`.

`synchronize` **nunca** debe ir en `true` en producción — usa siempre migraciones ahí.

## Scripts disponibles

- `npm run start:dev`: ejecuta la app en modo desarrollo (watch).
- `npm run build`: genera la compilación de producción.
- `npm run start:prod`: levanta la app compilada.
- `npm run lint`: ejecuta ESLint con `--fix`.
- `npm run test`: ejecuta pruebas unitarias.
- `npm run test:cov`: pruebas unitarias con reporte de cobertura.
- `npm run test:e2e`: pruebas de integración HTTP de análisis, perfiles requeridos, recomendaciones y embeddings (`test/*.e2e.spec.ts`). Levantan la app completa con `AI_PROVIDER=fake` contra un Postgres + pgvector desechable: antes `npm run test:db:up` (Docker, puerto 5433) y al terminar `npm run test:db:down`. Cada corrida borra el esquema y aplica las migraciones; solo aceptan una `TEST_DATABASE_URL` local (nunca tocan Neon).
- `npm run migration:generate`: genera una migración a partir de los cambios en las entidades.
- `npm run migration:run` / `migration:revert`: aplica o revierte migraciones (la del modelo v2.0 no se puede revertir).
- `npm run seed`: pobla catálogos (programas, habilidades, tipos y categorías de proyecto) y datos de prueba (usuarios, colaboradores, proyectos). Es idempotente.

## Guardarraíles de esta iteración

- No hay lógica de IA, matchmaking, dashboard, gestión de personas ni convocatorias por correo (RF12–RF22, RF25–RF26) — `AiModule` y `MatchmakingModule` son módulos vacíos.
- Formación, certificaciones, idiomas, teléfono, ciudad y franja horaria de disponibilidad quedan fuera del PMV.
- `passwordHash` nunca se expone en ninguna respuesta (columna `select: false`, y los casos de uso solo devuelven los campos públicos del usuario).

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
