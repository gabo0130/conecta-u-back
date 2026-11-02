# Traspaso de sesión — Líder técnico de Conecta U (16/10/2026)

Documento para retomar el trabajo en una sesión nueva sin perder contexto. Léelo completo antes de actuar.

## 1. Rol y reglas de trabajo
- **Rol (el usuario lo definió para la sesión anterior; pídele confirmar si debe seguir):** líder técnico de Conecta U que **propone y también hace**. Valida las integraciones front ↔ back; al cerrar una tarea grande comprueba que todo funcione integrado (tsc, lint, tests, build, pruebas en vivo) y lanza el agente `clean-code-reviewer` (existe en `.claude/agents/` de **ambos** repos) sobre lo tocado. Profundidad de respuesta según la complejidad de la petición.
- Responder en **español**, conciso. **No hacer commits** salvo que el usuario lo pida (hay muchos cambios sin commitear en los dos repos). Pedir confirmación antes de tocar lo compartido o irreversible (migraciones, Neon, despliegue). Lo ya autorizado (pruebas en vivo con datos de desarrollo) se sigue haciendo.
- **Reportar al usuario lo que dicen los subagentes:** su reporte llega a Claude, no a la pantalla del usuario; siempre resumirlo (esto falló en la sesión anterior).
- Trampas de herramientas: en el Bash de este entorno los heredocs con acentos/comillas mezcladas fallan ("unexpected EOF"). Para archivos grandes usar la herramienta **Write**, o escribir un script `.py` con Write y ejecutarlo. Los puertos: el 3001 lo ocupa **otra sesión** (servidor `conecta-u-back-ai-down`, no detenerlo); para pruebas propias levantar `PORT=3002 npx nest start` en segundo plano y detenerlo al terminar (netstat + taskkill).

## 2. Repos y entorno
- Backend NestJS: `C:\Proyectos\conecta-u-back` (capas presentation → application → domain ← infrastructure; puertos con `Symbol` en `shared/interfaces/tokens.ts`). Frontend Next.js: `C:\Proyectos\conecta-u`. La carpeta `notes/` está **duplicada** en ambos repos: al cambiar `notes/backend-iteracion-2.md` copiarla al front.
- Contrato de la Iteración 2: `notes/backend-iteracion-2.md` (**§12 = contrato implementado**, fuente de verdad para el front). Plan original: `notes/plan-iteracion-2.md`. Reglas del front: `notes/reglas-frontend.md`.
- BD: **Neon compartida** (Postgres con pgvector). Migración `AddAnalysisAndMatchmaking` ya aplicada. Scripts: `npm run migration:run`, `npm run seed` (idempotente).
- `.env` del backend (tiene la `GEMINI_API_KEY` del usuario; **nunca imprimirla**): `AI_PROVIDER=gemini`, `GEMINI_MODEL=gemini-3.8-flash` (`gemini-2.5-flash` da 404 con esta llave), `GEMINI_EMBEDDING_MODEL=gemini-embedding-001`, `EMBEDDING_DIM=768`, `AI_TIMEOUT_MS=55000`, `MATCH_WEIGHTS=0.5,0.2,0.15,0.15`, `MATCH_TOP_N=10`. Para no gastar IA se puede poner `AI_PROVIDER=fake`.
- Cuentas del seed (solo desarrollo): `laura.mendez@conectau.test` (LIDER con perfil), `mario.quintero@conectau.test` (LIDER sin perfil), `carlos.contreras@conectau.test` (COLABORADOR), `admin@conectau.test` (ADMIN); contraseña `Test1234!`. API en `/api` (login devuelve `access_token`).
- Pruebas de BD ad hoc: script Node con `pg` (`NODE_PATH=C:/Proyectos/conecta-u-back/node_modules`, `dotenv` con ruta `C:/Proyectos/conecta-u-back/.env`); no dejar el script en el repo.

## 3. Lo construido (backend, Iteración 2: RF8–RF13 + extras)
- **Análisis con IA (RF8–RF10):** `POST/GET /projects/:id/analysis`, `GET /projects/:id/analyses`. Gemini con salida JSON estructurada (prompt `v1`, `gemini-prompt.ts`), reintento ante 429/5xx (`retry-transient.ts`), un reintento si el JSON es inválido, mapeo al catálogo con sinónimos, embeddings opcionales. Límites: 1 en curso por proyecto (se libera a los 4 min) y 5 por día (no cuentan los `ERROR`). 503 con el mensaje del contrato; el proyecto vuelve a su estado. Reserva atómica del turno con `pg_advisory_xact_lock` (`claim` en `typeorm-project-analysis.repository.ts`); `complete` guarda análisis + perfiles + pasa el proyecto a `ANALIZADO` en una transacción. `outdated` por huella del proyecto.
- **Perfiles manuales (RF9):** `POST /projects/:id/required-profiles`, `PATCH …/:profileId` (editar, reemplazar habilidades, descartar con `active:false`); habilidades solo del catálogo ACTIVO.
- **Embeddings:** `POST /admin/embeddings/rebuild` `{force?, limit?}`; los repositorios de habilidades/experiencias/resumen dejan `embeddingUpdatedAt = null` al cambiar contenido; el texto del embedding se depura de correos, enlaces y teléfonos.
- **Recomendaciones (RF11–RF13):** `domain/services/match-score.ts` (función pura: S 0,5 · M 0,2 · E 0,15 · A 0,15; coseno reescalado de [0,5–0,85] a [0–1]; sin embedding su peso se reparte), `POST/GET /projects/:id/recommendations`, `GET …/:recommendationId`. Candidatas: activas y con consentimiento (también al leer), sin el propio líder, sin NO_DISPONIBLE salvo `includeUnavailable`. Sin correo/teléfono en las respuestas. `POST` refresca embeddings pendientes con tope de 20 s.
- **Catálogo:** 87 habilidades ACTIVAS (58 conocimientos, 10 competencias, 19 blandas) con sinónimos; el seed adopta propuestas PENDIENTE que el catálogo oficial incluye.
- **Otros:** correo de bienvenida (SMTP opcional), RF18 (gestión de catálogos en `/settings`), Postman actualizado (`postman/`: carpetas *AI Analysis*, *Recommendations*, *Embeddings*).
- **Calidad:** última corrida 110 suites / 572 tests en verde, `tsc` y `eslint` limpios. Revisión `clean-code-reviewer` hecha sobre el backend de la Iteración 2: 1 crítico + 7 importantes corregidos (consentimiento al leer, carrera en límites, estados atascados, rebuild colgado, errores crudos en `errorMessage`, datos de contacto hacia Google, constantes duplicadas, huecos de tests).

## 4. Datos que quedaron en Neon (por pruebas)
- Embeddings reales (Gemini) de 61 personas; 3 sin contenido quedan "al día" sin vector.
- Análisis reales con Gemini en "Reducción de desperdicio de alimentos (IoT)" y "Gestión de visitas empresariales"; 16 recomendaciones generadas para el primero. Proyecto "Test" (Laura): análisis con el fake + un perfil manual descartado. SISGELAB está en BORRADOR (sirve para probar el primer análisis; su intento de hoy falló por 503 de Gemini).
- Residuos de pruebas anteriores por limpiar si el usuario quiere: `prueba.bug.colaborador@example.com`, entradas "PRB"/PRUEBA_RF22 de catálogos, 2 colaboradores de la prueba de importación, habilidades PENDIENTE de prueba ("lider", "Curiosidad de prueba", "Empatia de prueba", "Solid").

## 5. Pendiente inmediato (en este orden)
1. **Modelo de respaldo de Gemini — hecho:** `GEMINI_FALLBACK_MODEL` (por defecto `gemini-3.5-flash-lite`; vacío lo desactiva), usado en `infrastructure/ai/gemini-project-analyzer.ts` solo tras agotar los reintentos por error transitorio. Documentado en `.env.example`, README y §12 (ambos repos), con spec en `gemini-adapters.spec.ts`. Ya respondió en vivo (historial del proyecto "Test", 16/10 08:47, `gemini-3.5-flash-lite`, 14 s).
2. **Validar la integración con el front** cuando la otra sesión termine: ver §6.
3. **Revisión de calidad del front:** hay dos agentes `clean-code-reviewer` distintos (uno por repo, cada uno con su propio archivo en `.claude/agents/`). Esta sesión solo ejecutó el del **backend** y corrigió esos hallazgos. Los hallazgos del agente del **front** los vio el usuario en otra sesión y **esta sesión no los recibió ni los corrigió**: pedirle al usuario ese reporte (o lanzar el agente del front) y no mezclar ambas revisiones.
4. Decisión pendiente del usuario: las dos brechas de la auditoría (solo llega el primer mensaje de validación al cliente; no se detectan nombres de entregable duplicados).
5. Despliegue en Render (03/11): variables de entorno (incluidas las de IA), `npm run migration:run` (extensión `vector` en Neon producción) y seed. Pedir confirmación antes.
6. Calibrar con el dataset la semana del 26/10: rango semántico `SEMANTIC_FLOOR/CEILING` (`match-score.ts`) y pesos.
7. Menores aceptados sin hacer: orden de entregables en la huella (cambiaría las huellas guardadas), guarda de concurrencia al guardar embeddings, mover `profileEmbeddingText`/`parseVector`, `rankCandidates` con muchos parámetros, `generatedAt: null` ambiguo (nunca generado vs. sin coincidencias).

## 6. Estado del frontend y checklist de integración
- La sesión del front trabaja con dos prompts ya escritos en `conecta-u/notes/`: `prompt-frontend-iteracion-2.md` (análisis y perfiles) y `prompt-frontend-recomendaciones.md` (recomendaciones, después del primero). Cambios obligatorios del cliente: timeout de 60 s solo en `POST …/analysis` (y `…/recommendations`), y excluir la IA del banner "servidor despertando" (el 503 de la IA ≠ servidor dormido); tras un timeout sin respuesta consultar `GET …/analysis`.
- Al validar: rutas `/proyectos/[id]/analisis` y `/proyectos/[id]/recomendaciones` (las maquetas viejas `/proyectos/analisis` y `/proyectos/recomendaciones` deben desaparecer); tipos del front = DTO de §12; 404 de `GET …/analysis` = "sin análisis", no error; `outdated`; `catalogued:false` en gris; perfiles IA/Manual; habilidades blandas separadas (`groupBySoftSkill`); `hasUser`; panel "¿Por qué?" con `breakdown.weights`; el ADMIN solo lectura; el SkillPicker del formulario de perfil sin "proponer habilidad nueva". Comprobar `tsc`, `lint`, `build` y tests del front, y recorrer el flujo en el navegador contra el backend (puerto 3001 de la otra sesión o 3002 propio).

## 7. Cosas que el próximo líder debe recordar
- Gemini: `thinkingLevel: LOW`, `maxOutputTokens 16384`, el análisis real tarda 15–45 s; las llamadas a Gemini cuestan, probar con `fake` cuando se pueda.
- Las recomendaciones **no se recalculan solas**; `includeUnavailable=true` en el GET solo muestra NO_DISPONIBLE si la generación también lo incluyó.
- Si se cambia el modelo de embeddings o el proveedor: `POST /admin/embeddings/rebuild` con `{"force": true}` (repetir mientras `remaining > 0`).
- `EMBEDDING_DIM` debe ser 768 (la columna `vector(768)`); otro valor aborta el arranque a propósito.
