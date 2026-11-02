# Plan de ajuste — Revisión Clean Code (25/09/2026)

Origen: revisión del agente `clean-code-reviewer` sobre el commit `ed0e380` (modelo v2.0). 3 🔴 · 10 🟠 · 7 🟡 · 3 💡.
Regla: cada fase deja `npm test`, `npm run lint` y `npx tsc --noEmit` en verde antes de pasar a la siguiente.

## Fase 1 — Infraestructura transversal
- [x] `PersistenceModule`: registra entidades ORM, repositorios TypeORM y sus tokens una sola vez (🟠 JwtModule/repos copiados en 6 módulos).
- [x] `SecurityModule`: JwtModule con `JWT_SECRET` obligatorio (`getOrThrow`, sin `'dev-secret'`), hasher, token service y guards.
- [x] Puerto `UnitOfWork` en dominio + `TypeOrmUnitOfWork` (`dataSource.transaction`).
- [x] Mappers ORM→dominio compartidos en `infrastructure/database/typeorm/mappers` (🟡 mapeo de Skill ×5).
- [x] Entidades de dominio con objeto de props (`CollaboratorEntity`, `ProjectEntity`, `ExperienceEntity`) (🟡 12–19 parámetros posicionales).
- [x] Filtro global: `23503`→400, `23505`→409, `22P02`→400 como red de seguridad; usar `AppLoggerService` en vez de `console.error`.

## Fase 2 — Autenticación (🔴 ×2, 🟠 ×1)
- [x] `RegisterUseCase`: valida el programa antes de escribir y crea usuario + colaborador dentro de `UnitOfWork`.
- [x] `RegisterDto`: `@IsDefined` del bloque `collaborator` cuando `role = COLABORADOR`; sin el `&& data.collaborator` silencioso.
- [x] `JwtAuthGuard`: rechaza usuarios inactivos y usa el rol de la BD.
- [x] `RefreshTokenUseCase` (sale lógica del controlador; valida `active`, usa `user.role`).
- [x] Constante única para `expires_in`.

## Fase 3 — Reglas de dominio compartidas
- [x] `domain/entities/collaborator-limits.ts` (horas, meses, semestre, año de último uso) usado por DTOs e importación (🟠 DRY de límites).
- [x] `domain/entities/data-consent.ts` → `consentFields()` en los tres flujos (🟠 `dataConsentAt` faltante).
- [x] `domain/entities/experience-period.ts` → `endDate ≥ startDate` y `current` sin `endDate` (🟡).
- [x] `ProjectTypeEntity.validateTypeData()` en dominio, valida también `kind`/`options` (💡, reemplaza `shared/utils/validate-type-data`).
- [x] `computeDurationMonths` con UTC (🟡).
- [x] `normalizeSkillName` conserva `#`/`+` y colapsa espacios; la búsqueda normaliza `q` (🟠).

## Fase 4 — Casos de uso de aplicación
- [x] `application/support`: `findMyCollaboratorOrFail`, `findProgramOrFail`, `assertSkillsExist`, `findActiveProjectTypeOrFail`, `findActiveCategoryOrFail`, `resolveOrProposeSkill` (💡 helper 404, 🟠 resolución duplicada).
- [x] Validación de IDs de catálogo en proyectos, perfil y experiencia (🟠 → 404/400 en vez de 500 o silencio). `SkillRepository.findByIds`.
- [x] `application/mappers/collaborator-response.mapper.ts`: una sola forma de respuesta para perfil, habilidades y experiencia (🟠).
- [x] `UpdateProjectDto.deliverables` con `@ArrayMinSize(1)` (🟡).

## Fase 5 — Importación Excel (🔴 ×1, 🟠 ×2)
- [x] Puertos `CollaboratorWorkbookReader` / `CollaboratorTemplateWriter` en dominio; adaptador ExcelJS en `infrastructure/excel` (DIP: sin `exceljs` ni Multer en `application`).
- [x] Parsers puros por hoja en `application/import` con los límites del dominio y validación de correo.
- [x] Una transacción por colaborador; fallo → fila rechazada, no 500. Habilidades deduplicadas.
- [x] Filas de Habilidades/Experiencia huérfanas → `rejected`.
- [x] Búsqueda de programa exacta (sin `ILike` con comodines), `YES_LABELS` sin código muerto, mensaje de tamaño desde la constante.

## Fase 6 — Presentación
- [x] `ParseUUIDPipe` en `:id` (colaboradores, proyectos, usuarios) y `SearchSkillsQueryDto` (🟡 500 por entradas mal formadas).

## Fase 7 — Datos y migraciones
- [x] Migración v2.0: `down()` explícitamente irreversible y precondición de tablas vacías en `up()` (🟠, 💡).
- [x] Seed: `ADMIN_PASSWORD` obligatorio en producción; correo admin alineado con `.env.example` (🟡).

## Fase 8 — Tests
- [x] Specs compilan con `tsc --noEmit` (mocks tipados, contratos v2.0) (🟡).
- [x] Specs nuevos para cada caso de uso/helper tocado; cobertura ≥ 90 %.
- [x] Verificación en vivo contra Postgres descartable y Postman.

## Ronda 2 — re-revisión (✅ aprobado, 7 🟡 + 1 💡 nuevos, corregidos)
- [x] Fechas imposibles (`2024-02-30`): `domain/entities/calendar-date.ts` usado en `ExperienceDto` (`@IsCalendarDate`), importación y `kind: 'date'`; filtro traduce `22008`.
- [x] Límite de 5 MB en un solo lugar (Multer, presentación) con `FileTooLargeFilter` → 413 en español; el caso de uso recibe solo el contenido.
- [x] Columna `categoria` de Habilidades: se usa al proponer habilidades nuevas (`SKILL_CATEGORY_LABELS`).
- [x] Longitudes de texto (`PERSON_NAME_MAX_LENGTH`, etc.) en `collaborator-limits.ts`.
- [x] `computeDurationMonths` cuenta meses completos (31/01 → 01/02 = 0).
- [x] `findBlocker` → `resolveNewCollaborator` con `ParseResult`.
- [x] Puerto del libro Excel con `Uint8Array` (sin `Buffer` de Node en el dominio).
- [ ] **Frontend (pendiente):** tipar `CollaboratorSkill.skill` como `Pick<Skill, 'id' | 'name' | 'type' | 'category'>` en `conecta-u/src/apis/interfaces/collaborator.ts` (la API ya no manda `synonyms`/`status` ahí; hoy nadie los lee).

## Ronda 3 — métricas de complejidad (26/09/2026)
- [x] `pickDefined` reemplaza los condicionales `x !== undefined ? {x} : {}` en 5 repositorios y 3 casos de uso (complejidad 11–15 → ≤ 9).
- [x] `CollaboratorsController` (11 dependencias) → `CollaboratorProfileController`, `CollaboratorSkillsController`, `CollaboratorExperienceController`; rutas sin cambios.
- [x] Importación: `ImportReport` (`application/import/import-report.ts`) y funciones cortas (`importRow`, `prepare`, `createCollaborator`, `saveSkills`, `saveExperience`).
- [x] Agente `clean-code-reviewer`: DRY como principio propio (conocimiento vs. duplicación accidental, regla de tres, abstracciones existentes del repo, dónde vive la única representación).
- Aceptado sin cambios: parsers de filas (validaciones lineales), `??` de valores por defecto en constructores, inyección de 5 dependencias en casos de uso.

## Ronda 4 — segunda revisión (plan en 7 puntos, 27/09/2026)
- [x] **1. Cascada al borrar usuarios:** `DeleteUserUseCase` responde 409 si el usuario lidera proyectos o si un ADMIN intenta borrarse a sí mismo; FK `projects.leaderId` → `RESTRICT` (migración `1790500000000-RestrictProjectLeaderDelete`, verificada: `confdeltype = r`).
- [x] **2. `null` en los PATCH:** `@IsOptionalNonNull()` (`application/dto/validators`) rechaza `null` con 422 en campos NOT NULL o ids; `@IsOptional()` + tipo `T | null` solo donde `null` vacía el campo (semestre, grupo, resumen, enlace, fecha fin, descripción, año de último uso, programa del proyecto). `update-project` ya no valida `programId: null` contra el catálogo. `validationExceptionFactory` informa solo "no puede ser nulo" cuando el campo llega en `null` y conserva la ruta de los errores anidados. Verificado en vivo: 9/9.
- [x] **3. `profileUrl`:** regla única `isProfileUrl` en el dominio (solo http/https con dominio, máx. `PROFILE_URL_MAX_LENGTH` = 300) usada por `@IsProfileUrl()` en los DTO de creación/actualización del perfil y por el parser del Excel (fila rechazada con causa). Columna `collaborators.profileUrl` → `varchar(300)` (migración `1790600000000-LimitCollaboratorProfileUrl`). Motivo: el frontend lo pinta en `<a href>` (XSS con `javascript:`). Verificado en vivo: 6/6.
- [x] **4. Texto obligatorio igual en API y Excel:** reglas en `domain/entities/text-rules.ts` (`normalizeText`, `requiredTextError`, `maxLengthError`) usadas por `@IsRequiredText()` / `@IsOptionalText()` (recortan antes de validar; opcional vacío → `null`) y por el parser del Excel (`requiredCell` / `optionalCell`): mismo criterio y mismo mensaje ("nombres es obligatorio", "… admite máximo N caracteres"). Se quitaron los `.trim()` manuales de los casos de uso. Longitudes de usuario, proyecto y habilidad en `domain/entities/field-limits.ts`. El Excel ahora valida también el largo de `habilidad` y de cada `tecnologias` (antes fallaba en la BD). Verificado en vivo: 8/8.
- [x] **5. Mappers de respuesta:** `user-response.mapper.ts` (`toUserResponse` = id, fullName, email, role, active; `toSessionUserResponse` = + menú) usado por los 7 casos de uso de cuentas y por los resúmenes del ADMIN (`toLinkedUser`, líder del proyecto); `project-response.mapper.ts` (`toProjectResponse`) en crear/listar/ver/actualizar proyecto y en `/admin/projects`; `skill-response.mapper.ts` (`toSkillSummary`) compartido por perfil y proyecto. Ya no salen `normalizedName`, `synonyms`, `status` de habilidades ni `projectId` de entregables. `login`, `me` y `register` ahora incluyen `active`; el líder en `/admin/projects` incluye `role`. Se borró `UserResponseDto` y `LoginResponseDto.user` toma el tipo del mapper. Verificado en vivo: 11/11.
  - **Frontend (pendiente):** tipar `Project.knownSkills` como `Pick<Skill, 'id' | 'name' | 'type' | 'category'>[]` y agregar `active` a `UserWithMenu` (hoy nadie lee los campos que salieron).
- [ ] 6. Postman y README (`/admin/*`, paginación `meta`).
- [ ] 7. Menores (lint sin `--fix`, mensajes en español, números mágicos, availability con mapper, `findSkillOrFail` y regla de dueño del proyecto, código muerto, logout en español, `as never` en specs, `Page` al dominio, seed atómico, numeración RF).
