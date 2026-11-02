# Traspaso de sesión — Conecta U (full-stack)

_Generado el 16/10/2026 para iniciar una sesión nueva sin perder contexto. Todo lo de aquí fue verificado ese día contra el código y la base; donde algo es inferido se dice._

## 0. Cómo usar este documento

1. Abre la sesión nueva en `C:\Proyectos\conecta-u-back` y agrega `C:\Proyectos\conecta-u` como directorio adicional (necesita los dos repos).
2. Pega el **prompt de arranque** de la sección 1.
3. La sesión nueva debe leer este archivo completo antes de tocar código (`notes/handoff-sesion-fullstack.md`; hay copia idéntica en el repo del front).

---

## 1. Prompt de arranque (copiar y pegar)

```
Eres el desarrollador senior full-stack de Conecta U (UFPS, Seminario III). Conoces todo el proyecto y trabajas en los dos repos: el backend NestJS (C:\Proyectos\conecta-u-back) y el frontend Next.js (C:\Proyectos\conecta-u). Si te pido un desarrollo, haces lo necesario en uno o en ambos para entregarlo funcionando y verificado.

Antes de escribir código, lee completo notes/handoff-sesion-fullstack.md (contexto, estado, pendientes, trucos del entorno), notes/backend-iteracion-2.md §12 (contrato de la API), notes/plan-cierre-iteracion-2.md (plan por fases), notes/reglas-frontend.md y el CLAUDE.md del front.

Cómo trabajas:
- Antes de desarrollar, evalúas las alternativas, eliges la mejor y dices en pocas líneas por qué. Después implementas.
- SOLID, YAGNI, KISS y DRY; patrones de diseño solo donde aportan (puertos/adaptadores, estrategia, fábrica…), sin sobreingeniería. Arquitectura por capas del backend: presentation → application → domain ← infrastructure.
- No usas los subagentes conecta-u-architect ni clean-code-reviewer: diseño y revisión los haces tú, en línea.
- No haces commits ni push salvo que el usuario lo pida. No actúas sobre opciones que ofreces hasta que el usuario elija una.
- Acciones sobre la base compartida (Neon), migraciones, borrados o cualquier cosa irreversible: pides confirmación antes.
- Respondes en español, conciso. Verificas lo que haces (tsc, eslint, jest y, si aplica, en vivo contra el backend); no declaras algo terminado sin comprobarlo y reportas con honestidad lo que no pudiste probar.

Objetivo actual: cerrar la Iteración 2 (análisis con IA y matchmaking, RF8–RF13) siguiendo el plan de cierre. Lo siguiente es verificar el estado actual y continuar con el frontend de recomendaciones (Fase 2) y lo que el usuario priorice.
```

---

## 2. Rol y reglas de trabajo

**Rol:** desarrollador senior full-stack, experto en todo el proyecto. Decide con criterio técnico, evalúa opciones antes de construir y entrega con pruebas.

**Reglas del usuario (vigentes, también guardadas en la memoria de Claude Code):**
- No commitear salvo que el usuario lo pida expresamente (ni "al terminar").
- No ejecutar una opción que se ofreció solo porque el usuario confirmó el síntoma; esperar a que elija.
- No usar los subagentes `conecta-u-architect` ni `clean-code-reviewer`.
- Idioma: español; respuestas concisas; la documentación del proyecto está en español.
- Pedir confirmación antes de migraciones, borrados o escrituras masivas en la base de Neon (es compartida/real).

**Principios de código:** SOLID, YAGNI, KISS, DRY; patrones con propósito. Pruebas unitarias para casos de uso, mappers, adaptadores y controladores; `tsc`, `eslint` y `jest` deben quedar en verde.

---

## 3. El proyecto

**Conecta U:** plataforma de la UFPS donde líderes de proyecto (docentes/investigadores) describen un proyecto, la IA lo analiza para sacar perfiles requeridos, y el sistema recomienda colaboradores (estudiantes, docentes, egresados) por correspondencia de habilidades, afinidad semántica, experiencia y disponibilidad. Roles: `ADMIN`, `LIDER`, `COLABORADOR`.

**Repos y rutas**
| Repo | Ruta | Stack |
|---|---|---|
| Backend | `C:\Proyectos\conecta-u-back` | NestJS 11, TypeORM 0.3.31, PostgreSQL (Neon) + pgvector, Jest |
| Frontend | `C:\Proyectos\conecta-u` | Next.js (App Router), CSS modules, atomic design, Jest + Testing Library |
| (sesión) | `C:\Proyectos\template-nextjs` | solo es el directorio base de la sesión de Claude Code |

**Arquitectura del backend (por capas):** `presentation` (controladores, módulos Nest, guards) → `application` (casos de uso, DTO, mappers, servicios de aplicación) → `domain` (entidades, puertos `*.interface.ts`, servicios puros como `match-score`) ← `infrastructure` (TypeORM, adaptadores de IA, correo). Los puertos se enlazan por `Symbol` en `src/shared/interfaces/tokens.ts`. Prefijo global de rutas: `/api`. `ValidationPipe` global responde 422; `HttpExceptionFilter` deja un solo mensaje por error.

**Frontend:** `src/apis` (cliente axios, `shared-request`, `interfaces/*`), `src/modules/<dominio>/hooks`, `src/components/{atoms,molecules,organisms}`, rutas en `src/app/(protected)/…`. Reglas en `notes/reglas-frontend.md`.

**Documentos clave (en `notes/` de ambos repos, mantenidos en espejo):** `backend-iteracion-2.md` (contrato; §12 = lo implementado), `plan-cierre-iteracion-2.md`, `estado-desarrollo.md`, `reglas-frontend.md`, `arquitectura.md`, `plan-ajuste-clean-code.md`, y este traspaso. `README.md` y `postman/` del backend documentan las rutas.

---

## 4. Estado verificado (16/10/2026)

| Verificación | Backend | Frontend |
|---|---|---|
| `tsc --noEmit` | ✅ limpio | ✅ limpio |
| `eslint` | ✅ limpio | ✅ limpio |
| `jest` | ✅ 626 tests / 112 suites | ✅ 86 tests / 17 suites |
| Migraciones en Neon | ✅ 8 aplicadas (la última: `AddEmbeddingModel1790900000000`) | — |

**Sin commitear:** casi todo el trabajo de la Iteración 2 y de las sesiones anteriores está en el árbol de trabajo de ambos repos (backend: decenas de archivos nuevos/modificados; front: ~30 cambios). No se hizo ningún commit en esta línea de trabajo, por la regla del usuario. Al commitear conviene correr antes `git add --renormalize .` (se agregó `.gitattributes`).

---

## 5. Lo que ya está hecho

### Iteración 1 y mejoras posteriores (resumen)
- Autenticación (JWT + refresh), usuarios/roles/menú, perfil técnico del colaborador (habilidades, experiencias, disponibilidad), proyectos (tipos con plantilla de campos dinámica, categorías, entregables), importación masiva de colaboradores por Excel con historial.
- **Habilidades blandas separadas** al visualizar (`groupBySoftSkill`) en `/perfil`, `/colaboradores/[id]`, `/proyectos/[id]` y el `SkillPicker`.
- **RF18 — administración de catálogos** (ADMIN): `/api/admin/catalogs/*` para programas, tipos y categorías de proyecto y habilidades (crear, editar, activar/desactivar, aprobar habilidades `PENDIENTE`); pantalla `/settings` con 4 pestañas. Sin borrado físico.
- **Correo de bienvenida** al crear cuenta (módulo SMTP con respaldo "solo log", plantilla por rol; falla del SMTP nunca rompe el registro).
- Auditoría de flujos alternos (dejó dos brechas abiertas, ver §7).

### Iteración 2 — Backend (RF8–RF13), implementado y probado en vivo
- **Datos:** migraciones `AddAnalysisAndMatchmaking` (pgvector, tablas `project_analyses`, `required_profiles`, `required_profile_skills`, `recommendations`, columnas de embedding en `collaborators`) y `AddEmbeddingModel` (guarda con qué modelo se generó cada embedding; vectores de modelos distintos no se comparan).
- **IA (puertos y adaptadores):** `ProjectAnalyzer` y `EmbeddingProvider` con adaptadores `Fake*` (deterministas, `AI_PROVIDER=fake`, por defecto) y `Gemini*` (`AI_PROVIDER=gemini`). Salida JSON estructurada con prompt versionado (`promptVersion v1`), validador tolerante con un reintento, mapeo al catálogo por nombre/sinónimo (las no catalogadas quedan `skillId=null`).
- **Gemini:** modelo `gemini-3.8-flash` (el `gemini-2.5-flash` responde 404 a la llave actual), respaldo `gemini-3.5-flash-lite` ante saturación, `thinkingLevel LOW`, reintentos ante 5xx dentro de un presupuesto de `AI_TIMEOUT_MS=55000`, detección de cuota diaria agotada, embeddings `gemini-embedding-001` a 768 dimensiones normalizados.
- **Endpoints** (todos bajo `/api`, detalle y cuerpos exactos en `backend-iteracion-2.md` §12):
  - `POST /projects/:id/analysis` (LIDER dueño; síncrono 15–45 s; 409 en curso o 5/día; 422 proyecto incompleto; 503 IA caída), `GET /projects/:id/analysis` (con `outdated`), `GET /projects/:id/analyses` (historial).
  - `POST /projects/:id/required-profiles` y `PATCH …/:profileId` (perfiles manuales, editar, descartar con `active:false`).
  - `POST /projects/:id/recommendations`, `GET …/recommendations?profileId=&includeUnavailable=`, `GET …/recommendations/:id` (desglose RF13). Puntaje = 100·(0,5·habilidades + 0,2·semántica + 0,15·experiencia + 0,15·disponibilidad), función pura `domain/services/match-score.ts`.
  - `POST /admin/embeddings/rebuild` (`{force?, limit?}`, también perfiles requeridos).
- **Invalidación de embeddings:** cualquier cambio de resumen/habilidades/experiencias de una persona deja su embedding desactualizado (en los repositorios, así cubre importación Excel y todos los casos de uso).
- **Recuperación:** servicio de recuperación de análisis `PENDIENTE` huérfanos (`analysis-recovery.service.ts`) — ver §6.
- **Catálogo:** 87 habilidades activas (58 conocimientos, 10 competencias, 19 blandas) con sinónimos, en el seed.
- **Documentación:** contrato §12, README (tabla de rutas y variables), colección Postman (carpetas *AI Analysis*, *Recommendations*, *Embeddings*).

### Iteración 2 — Frontend (RF8–RF10), implementado y verificado en navegador
- Cliente HTTP: opción tipada `skipServiceStatus` y `AI_REQUEST_CONFIG` (timeout 60 s + sin aviso de "servidor despertando") solo para `POST /projects/:id/analysis`; el timeout global sigue en 15 s. Pruebas del interceptor.
- `apis/interfaces/analysis.ts`, `modules/analysis/` (`useProjectAnalysis`, `useRequiredProfiles`, historial), rutas `/proyectos/[id]/analisis` (real) y `/proyectos/[id]/recomendaciones` (**solo "Próximamente"**), componentes `RequiredProfileCard`, `RequiredProfileModal`, `AnalyzingPanel`, `AnalysisHistoryList`; botones "Analizar con IA / Analizando… / Ver análisis" en el detalle del proyecto.

---

## 6. Trabajo de otra sesión detectado hoy (verificar al empezar)

Hay una sesión paralela ("Fullstack conecta u (fork)") que modificó el backend mientras tanto. Lo que se ve en disco, ya compilando y con tests en verde:
- `analysis-recovery.service.ts` + spec (limpieza de análisis `PENDIENTE` huérfanos; los casos de uso de listar/consultar la invocan) → probablemente cubre el primer ítem de la Fase 1.
- Migración `AddEmbeddingModel` (aplicada en Neon), `stored-embedding.ts`, `embedding-columns.ts`; `FakeEmbeddingProvider.model = 'fake/hash-v1@64'`; `rebuild` ahora recalcula también los embeddings de perfiles requeridos (`ProfileEmbedder.rebuildStale/markAllStale`).
- `retry-transient`: el 429 ya no se reintenta; `isDailyQuotaError` distingue cuota diaria de por minuto. `analysis-timeouts.ts` reparte un presupuesto único (`AI_TIMEOUT_MS`, más `EMBEDDING_TIMEOUT_MS`) entre IA, reintento y embeddings, para responder antes de los 60 s del front.
- `redactContactData` en el texto del embedding (quita correos, URLs, teléfonos del texto libre).
- **Acción:** al empezar, revisar `git status`/`git diff` del backend para saber qué quedó completo, y actualizar `notes/backend-iteracion-2.md` §12 si el contrato cambió (p. ej. respuesta de `rebuild` con `requiredProfiles`, mensajes de error).
- Segundo ítem de Fase 1 (`errorMessage` propio en español): **confirmado el 16/10** — `failureMessage()` en `request-project-analysis.use-case.ts` guarda mensajes seguros y deja el detalle solo en el log.

---

## 7. Lo que falta (checklist priorizado)

Más detalle, fechas y criterios de "hecho" en `plan-cierre-iteracion-2.md`.

**Frontend — Fase 2 (lo principal)**
- [x] Tipos (`apis/interfaces/recommendations.ts`) y hooks (`useRecommendations`: cargar, generar, detalle) con el contrato §12.
- [x] `/proyectos/[id]/recomendaciones`: selector de perfil, botón "Generar recomendaciones" (usa `AI_REQUEST_CONFIG`; 409 sin análisis), lista ordenada con barra de puntaje, disponibilidad, tipo de persona, programa, marca "sin cuenta"; filtro "incluir no disponibles" (solo existen quienes entraron en una generación hecha con ese flag); mostrar `generatedAt` y avisar que hay que regenerar tras editar perfiles.
- [x] Modal "¿Por qué?" (RF13): coinciden/faltan, experiencia, disponibilidad, semántica y pesos aplicados. Nunca mostrar correo/teléfono.
- [x] Botón "Ver recomendaciones" en el detalle del proyecto (ANALIZADO); `AdminProjectInfo` enlaza a las recomendaciones (solo lectura).
- [~] Pruebas, `tsc`, `eslint`, `build` y `estado-desarrollo.md` hechos (16/10). "Generar" y el estado "sin análisis" probados en vivo.
- [ ] Opcional: botón del ADMIN para `rebuild`. Pendiente anterior: tipar `CollaboratorSkill.skill` como `Pick<Skill, 'id'|'name'|'type'|'category'>`.

**Backend**
- [x] `errorMessage` propio en español (confirmado). - [ ] Documentar en §12 los cambios de la otra sesión.
- [ ] Brechas de auditoría (decisión pendiente): que lleguen todos los mensajes de validación y rechazar nombres de entregable duplicados.
- [x] Pruebas de integración de endpoints con `AI_PROVIDER=fake` (17/10): `npm run test:db:up && npm run test:e2e` (35 pruebas; ver `estado-desarrollo.md`).
- [ ] Calibrar `MATCH_WEIGHTS` con el dataset (sem. 26/10) y documentar en el FP-15.
- [x] Revisión de privacidad (Ley 1581), 17/10: 3 brechas corregidas (retiro de consentimiento, texto del proyecto a Gemini, campos cortos); detalle en `estado-desarrollo.md`.

**Datos y demo (Fase 3)** — pedir confirmación antes de borrar
- [x] Limpiar datos de prueba en Neon (17/10; detalle en `estado-desarrollo.md`). Lo que queda a propósito, en §9.
- [x] Guion de demo (`notes/guion-demo.md`) y 2 proyectos de demo con análisis real y recomendaciones: IoT (16) y Gestión de visitas (29). SISGELAB queda sin análisis para analizar en vivo.

**Despliegue (Fase 5)**
- [ ] Render: variables de §8; base de producción: extensión `vector`, `migration:run` (migraciones 4 a 8), `seed` (87 habilidades), `rebuild` con `force:true` hasta `remaining = 0`; front con `NEXT_PUBLIC_API_BASE_URL` (termina en `/api`) al backend publicado; prueba de humo. Ojo: el "despertar" de Render no debe confundirse con un fallo de IA.
- [ ] Commits/PRs por fase **solo cuando el usuario lo pida**.

**Hitos:** 29/10 sesión 1 con la cliente (RF8–RF10) · 03/11 despliegue · 04/11 sesión 2 (RF11–RF13) · 05/11 repruebas y Acta No. 4 · 06/11 cierre de la línea base.

### Decisiones pendientes del usuario
1. ¿Se arreglan las dos brechas de la auditoría?
2. ¿La sesión del 29/10 es en local o en el ambiente desplegado? (define si el despliegue se adelanta al 28/10)
3. ~~¿Se pueden limpiar los datos de prueba de Neon?~~ Resuelto el 17/10.
4. Estrategia de commits (rama por repo + PRs, o commits directos).

---

## 8. Entorno, variables y cuentas

**Backend** (`.env`; el repo tiene `.env.example` con todas): `PORT=3001`, `DATABASE_URL` (Neon, con SSL en la URL), `JWT_SECRET` (obligatorio), `ADMIN_EMAIL/ADMIN_PASSWORD`, SMTP (`SMTP_HOST`… opcional), y de IA: `AI_PROVIDER` (`fake` por defecto | `gemini`), `GEMINI_API_KEY` (**el usuario ya la puso en su `.env`; nunca imprimirla ni enviarla a ningún lado**), `GEMINI_MODEL=gemini-3.8-flash`, `GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite`, `GEMINI_EMBEDDING_MODEL=gemini-embedding-001`, `EMBEDDING_DIM=768`, `AI_TIMEOUT_MS=55000`, `MATCH_WEIGHTS=0.5,0.2,0.15,0.15`, `MATCH_TOP_N=10`.

**Cuentas del seed (solo desarrollo; contraseña `Test1234!`):** `laura.mendez@conectau.test` (LIDER con perfil técnico), `mario.quintero@conectau.test` (LIDER sin perfil), `carlos.contreras@conectau.test` (COLABORADOR), `admin@conectau.test` (ADMIN; la contraseña del admin puede cambiarse con `ADMIN_PASSWORD`).

**Proyectos de Laura:** "Reducción de desperdicio de alimentos (IoT)" y "Gestión de visitas empresariales" (con análisis real de Gemini); "SISGELAB — Sistema de gestión de laboratorios" (analizado con `fake`; ya llegó al máximo de 5 análisis hoy); "Test" (análisis `fake` y un perfil manual descartado).

**Datos:** 65 colaboradores (64 candidatos con consentimiento; 61 con contenido para embedding), 87 habilidades activas.

**Arranque y comandos**
- Backend: `npm run start:dev` (o la config `conecta-u-back-dev` del `.claude/launch.json` con `preview_start`), puerto 3001; Swagger en `/docs`.
- `npm run typeorm -- migration:show` (estado), `npm run migration:run`, `npm run seed` (idempotente; además adopta como ACTIVAS las propuestas pendientes que el catálogo oficial ya incluye).
- Login: `POST /api/auth/login` devuelve `access_token` (guion bajo, no camelCase).
- Front: `npm run dev`, `npm run build`, `npx jest`, `npx eslint src`, `npx tsc --noEmit`.

---

## 9. Datos de prueba que siguen en Neon (conservados a propósito el 17/10)

- Dataset de demo: 50 colaboradores `persona##@prueba.ufps.edu.co` importados (no borrar: dan las recomendaciones).
- `prueba.bug.colaborador@example.com` (usuario + perfil) y `prueba.historial1/2@example.com` con la importación `prueba_valida.xlsx`: el usuario no pidió borrarlos.
- Habilidades PENDIENTE: "lider" (en el perfil de Laura), "Solid" y 6 propuestas que parecen reales (electrónica, visualización de datos…).
- Proyectos de otras cuentas creados el 16/10 ("Monitoreo de la calidad del aire…", "Optimización de rutas…", "Tablero de indicadores…"): no son de Laura; no se tocaron.

## 10. Trucos y trampas del entorno (Windows + Git Bash)

- **Heredocs en Bash:** los que mezclan comillas simples, tildes o `'` dentro de un `cat <<EOF` a veces fallan con "unexpected EOF". Para archivos largos usa la herramienta de escritura de archivos, o un script Python escrito con ella.
- **`node -e` / `ts-node -e`** pueden no imprimir nada: escribe un `.js` temporal y bórralo después.
- **Rutas con `dotenv` en Node:** usar rutas de Windows (`C:/Proyectos/...`), no `/c/Proyectos/...`; para `require('pg')` fuera del repo, `NODE_PATH=C:/Proyectos/conecta-u-back/node_modules`. La conexión a Neon va **sin** opción `ssl` aparte (ya viene en la `DATABASE_URL`).
- Los nombres de herramientas son sensibles a mayúsculas (`Bash`, no `bash`).
- `curl` con tildes desde Bash puede mostrar `�` en pantalla aunque el dato llegue bien; verificar con un `GET` o la base.
- Reiniciar el backend si cambias el `.env` (el modo `--watch` no lo recarga). Reiniciar a mitad de un análisis deja un intento huérfano: ya existe el servicio de recuperación.
- `ThinkingLevel`, `responseSchema`, etc. del SDK `@google/genai` 2.30: ya verificados contra `genai.d.ts`.
- Gemini cambia sus modelos con frecuencia: ante un 404 listar `ai.models.list()` con la llave y fijar el modelo por variable de entorno.

---

## 11. Mapa rápido de archivos

**Backend (`src/`)**
- Controladores: `presentation/controllers/{analysis,required-profiles,recommendations,admin-embeddings,admin-catalogs,…}.controller.ts`; módulos `presentation/{analysis,matchmaking,persistence,catalogs,…}.module.ts` (los adaptadores de IA se eligen en `analysis.module.ts` según `AI_PROVIDER`).
- Casos de uso: `application/use-cases/{request-project-analysis,get-project-analysis,list-project-analyses,create-required-profile,update-required-profile,generate-recommendations,list-recommendations,get-recommendation-detail,rebuild-embeddings}.use-case.ts`.
- Servicios de aplicación: `application/analysis/*` (builder de entrada, validador de salida, mapeo al catálogo, embeddings, recuperación) y `application/matchmaking/*`.
- Dominio: `domain/services/match-score.ts`, `domain/entities/*`, `domain/repositories/*.interface.ts`.
- Infraestructura: `infrastructure/ai/*` (Gemini, Fake, reintentos, prompt), `infrastructure/database/typeorm/*`, `migrations/`, `infrastructure/database/seed.ts`.

**Frontend (`src/`)**
- `apis/{client.ts,shared-request.ts,interfaces/}`, `modules/{analysis,projects,collaborator,admin,catalogs,auth}/`, `components/organisms/{RequiredProfileCard,RequiredProfileModal,SkillPicker,ProjectView,AdminProjectInfo}`, `app/(protected)/proyectos/[id]/{page.tsx,analisis/,recomendaciones/}`.

---

## 12. Riesgos vigentes

| Riesgo | Mitigación |
|---|---|
| Gemini saturado, cuota o modelo retirado | modelo de respaldo, reintentos acotados, `AI_PROVIDER=fake` como plan B, revisar modelos antes de cada sesión con la cliente |
| Análisis lento (hasta ~45 s) vs. timeout del navegador | 60 s en el front, consulta del análisis tras un corte, datos de demo ya generados |
| pgvector no habilitado en producción | habilitar la extensión desde el panel de Neon antes de migrar; sin embeddings el puntaje sigue funcionando (reparte el peso) |
| Embeddings de modelos distintos mezclados | columna `embeddingModel`: solo se comparan vectores del mismo modelo; `rebuild` con `force:true` al cambiar de proveedor |
| Pesos poco creíbles | calibrar con el líder; pesos por variable de entorno |
| Trabajo sin commitear en dos repos y dos sesiones en paralelo | coordinar por `notes/`, revisar `git status` al empezar, commitear por fase cuando el usuario lo apruebe |
