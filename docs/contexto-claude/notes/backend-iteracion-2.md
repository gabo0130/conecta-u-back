# Instrucciones Backend y Frontend — Iteración 2 (Corte Tres): análisis con IA y matchmaking

_Conecta U · Entrega 3 · RF8–RF13 (HU-08 a HU-12) · línea base 1 (16/10 → 06/11/2026)_
_Decisiones del 15/10/2026: IA = **Gemini (Google)**; matchmaking **híbrido**: reglas + similitud semántica con embeddings (pgvector)._

Este documento es el contrato de la Iteración 2. Sigue la misma arquitectura por capas del backend (`presentation → application → domain ← infrastructure`), las convenciones de `plan-ajuste-clean-code.md` y las reglas del front (`reglas-frontend.md`).

---

## 1. Alcance de la iteración

| HU | RF | Qué entrega |
|---|---|---|
| HU-08 Analizar proyecto mediante IA | RF8 | El líder solicita el análisis de su proyecto; el sistema envía la información a Gemini, procesa la respuesta y maneja errores o indisponibilidad. |
| HU-09 Identificar perfiles requeridos | RF9 | Se presentan los perfiles requeridos (conocimientos, competencias y habilidades blandas, con nivel mínimo) y se distingue lo identificado por la IA de lo agregado manualmente. |
| HU-10 Consultar justificación de perfil | RF10 | Cada perfil muestra la justificación ligada a objetivos, tipo, entregables o necesidades del proyecto. |
| HU-11 Recomendar colaboradores | RF11–RF12 | Se comparan los perfiles requeridos con las personas registradas (con o sin usuario) y se genera una lista ordenada por correspondencia. |
| HU-12 Consultar justificación de recomendación | RF13 | Se muestran los elementos del perfil de la persona que sustentan la recomendación (habilidades, nivel, meses, experiencia, disponibilidad, afinidad semántica). |

Fuera de alcance (Iteración 3): convocatoria por correo (RF21–RF22), dashboard y reportes (RF15–RF16), gestión de personas y usuarios del admin (RF14, RF17–RF18).

RNF relevantes: **RNF8 Trazabilidad** (guardar entrada, versión de prompt, modelo y salida de cada análisis; guardar el desglose de cada puntaje), **RNF4 Seguridad** (solo el líder dueño analiza y ve recomendaciones de su proyecto; la API key nunca llega al front), **Ley 1581** (solo se recomiendan personas con `dataConsent = true` y `active = true`).

---

## 2. Flujo

```
Líder ─► POST /projects/:id/analysis
          │  1. Valida dueño y que el proyecto tenga título, resumen y objetivos
          │  2. Arma la entrada (proyecto + tipo + categoría + entregables + habilidades conocidas + catálogo de habilidades)
          │  3. Gemini (salida JSON con esquema) → perfiles con habilidades y justificación
          │  4. Mapea cada habilidad al catálogo (normalizedName / sinónimos); las que no existen quedan como "no catalogadas"
          │  5. Calcula el embedding de cada perfil requerido
          │  6. Guarda project_analyses + required_profiles (+ skills); proyecto pasa a ANALIZADO
          ▼
Líder ─► GET /projects/:id/analysis                     (RF9, RF10)
Líder ─► POST /projects/:id/recommendations             (RF11, RF12: calcula y guarda)
Líder ─► GET /projects/:id/recommendations?profileId=   (lista ordenada)
Líder ─► GET /projects/:id/recommendations/:recId       (RF13: desglose)
```

Estados del proyecto (ya existen en `PROJECT_STATUSES`): `BORRADOR → EN_ANALISIS → ANALIZADO`. Si el análisis falla, el proyecto vuelve a su estado anterior y el análisis queda en `ERROR` con el mensaje.

---

## 3. Modelo de datos (migración `AddAnalysisAndMatchmaking`)

Requiere la extensión **pgvector** (Neon la soporta): `CREATE EXTENSION IF NOT EXISTS vector;`. Dimensión configurable, por defecto **768** (`EMBEDDING_DIM`).

### project_analyses
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| projectId | uuid FK → projects (CASCADE) | |
| requestedById | uuid FK → users (SET NULL) | quién lo pidió |
| status | varchar(20) | `PENDIENTE`, `COMPLETADO`, `ERROR` |
| provider | varchar(20) | `gemini` / `fake` |
| model | varchar(60) | p. ej. `gemini-2.5-flash` |
| promptVersion | varchar(20) | p. ej. `v1` (RNF8) |
| input | jsonb | lo que se envió (sin datos personales) |
| inputTokens / outputTokens | int null | consumo (RT7, RT12) |
| rawOutput | jsonb null | respuesta cruda validada |
| summary | text null | resumen del análisis devuelto por la IA |
| errorMessage | text null | |
| durationMs | int null | |
| createdAt / completedAt | timestamptz | |

Se conservan todos los análisis (historial). El “vigente” es el último `COMPLETADO`.

### required_profiles
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| projectId | uuid FK → projects (CASCADE) | |
| analysisId | uuid FK → project_analyses (SET NULL) null | null si es manual |
| source | varchar(10) | `IA` o `MANUAL` (HU-09: distinguir origen) |
| name | varchar(120) | “Desarrollador backend” |
| description | text | |
| justification | text | RF10 |
| quantity | int (1–10) | personas sugeridas |
| priority | varchar(10) | `ALTA`, `MEDIA`, `BAJA` |
| minWeeklyHours | int null | dedicación sugerida |
| position | int | orden |
| embedding | vector(768) null | para la parte semántica |
| active | boolean | el líder puede descartar un perfil |
| createdAt / updatedAt | timestamptz | |

### required_profile_skills
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| requiredProfileId | uuid FK (CASCADE) | |
| skillId | uuid FK → skills null | null si la IA propuso algo fuera del catálogo |
| rawName | varchar(80) | nombre que devolvió la IA |
| type | varchar(20) | `CONOCIMIENTO`, `COMPETENCIA`, `HABILIDAD_BLANDA` |
| minLevel | varchar(12) | `BASICO`…`EXPERTO` |
| importance | varchar(10) | `ALTA` (peso 3), `MEDIA` (2), `BAJA` (1) |

### recommendations
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| requiredProfileId | uuid FK (CASCADE) | |
| collaboratorId | uuid FK → collaborators (CASCADE) | persona con o sin usuario |
| rank | int | 1 = mejor |
| score | numeric(5,2) | 0–100 |
| skillScore / semanticScore / experienceScore / availabilityScore | numeric(5,4) | 0–1, componentes del puntaje |
| breakdown | jsonb | desglose para RF13 (ver §5) |
| generatedAt | timestamptz | |

Índice único (`requiredProfileId`, `collaboratorId`). Al recalcular se reemplazan las recomendaciones del perfil.

### collaborators (columnas nuevas)
- `profileEmbedding vector(768) null`, `embeddingUpdatedAt timestamptz null`.
- Se recalcula cuando cambian resumen, habilidades, experiencia o al importar (marcar “sucio” y procesar en lote, ver §6).

---

## 4. Integración con Gemini

### Puertos (domain)
```ts
interface ProjectAnalyzer {           // AI_ANALYZER
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}
interface EmbeddingProvider {         // EMBEDDING_PROVIDER
  embed(texts: string[]): Promise<number[][]>;
}
```
Implementaciones en `infrastructure/ai/`: `GeminiProjectAnalyzer`, `GeminiEmbeddingProvider` y **`Fake*`** (determinísticas, para tests y para trabajar sin API key). Selección por `AI_PROVIDER=gemini|fake`.

### Variables de entorno
```
AI_PROVIDER=gemini
GEMINI_API_KEY=            # solo en el backend (Render); nunca en el front
GEMINI_MODEL=gemini-3.8-flash   # gemini-2.5-flash responde 404 a las llaves nuevas
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIM=768
AI_TIMEOUT_MS=55000             # presupuesto TOTAL del análisis (Gemini + reintentos + respaldo + embeddings)
EMBEDDING_TIMEOUT_MS=10000      # tope de cada cálculo de embeddings
MATCH_WEIGHTS=0.5,0.2,0.15,0.15   # habilidades, semántica, experiencia, disponibilidad
MATCH_TOP_N=10
```
SDK: `@google/genai`. Verificar en la documentación vigente los nombres de modelo y el parámetro de dimensión de salida del embedding (`outputDimensionality`) antes de fijarlos.

### Entrada al modelo (sin datos personales)
Título, resumen, objetivos, tipo y sus campos (`typeData`), categoría, programa, entregables, habilidades conocidas y la **lista del catálogo** (nombre, tipo y categoría de las habilidades ACTIVAS) para que el modelo elija de ella.

### Salida estructurada (responseSchema / JSON)
```json
{
  "resumen": "string",
  "perfiles": [
    {
      "nombre": "string",
      "descripcion": "string",
      "justificacion": "string (por qué este perfil, citando objetivos/entregables)",
      "cantidad": 1,
      "prioridad": "ALTA|MEDIA|BAJA",
      "horasSemanaSugeridas": 10,
      "habilidades": [
        { "nombre": "string", "tipo": "CONOCIMIENTO|COMPETENCIA|HABILIDAD_BLANDA", "nivelMinimo": "BASICO|INTERMEDIO|AVANZADO|EXPERTO", "importancia": "ALTA|MEDIA|BAJA" }
      ]
    }
  ]
}
```
Reglas del prompt (`promptVersion v1`): entre 1 y 5 perfiles; cada perfil con 2–8 habilidades e **al menos una habilidad blanda**; usar nombres del catálogo cuando exista equivalente; justificación en español, 1–3 frases, ligada al proyecto; no inventar datos de personas.

### Validación y errores
- Validar la respuesta contra el esquema (class-validator o zod). Si no cumple: un reintento; si vuelve a fallar → `ERROR`.
- Timeout, cuota o caída del servicio → **503** `{ message: "El servicio de análisis no está disponible. Intenta de nuevo en unos minutos." }` y el análisis queda en `ERROR` (criterio de HU-08).
- Mapeo al catálogo: `normalizeSkillName` + sinónimos. Lo que no coincida queda con `skillId = null` y se muestra como “no catalogada” (no se crean habilidades automáticamente).
- Límite: 1 análisis en curso por proyecto (409 si ya hay uno `PENDIENTE`).

---

## 5. Matchmaking híbrido (RF11–RF13)

Candidatos: colaboradores `active = true` y `dataConsent = true`, tengan o no usuario. Se excluye al propio líder del proyecto. Por defecto se excluyen `NO_DISPONIBLE` (parámetro `includeUnavailable`).

Para cada perfil requerido P y colaborador C:

| Componente | Cálculo (0–1) | Peso |
|---|---|---|
| **Habilidades S** | Σ wᵢ · nivelᵢ · expᵢ / Σ wᵢ, con wᵢ = importancia (3/2/1); nivelᵢ = min(nivel(C)/nivelMínimo, 1) (BÁSICO=1…EXPERTO=4), 0 si no la tiene; expᵢ = 0,7 + 0,3·min(meses/24, 1). Coincide por skillId (y por sinónimo si skillId es null). | 0,50 |
| **Semántica M** | similitud coseno entre `required_profiles.embedding` y `collaborators.profileEmbedding`, llevada a 0–1. Si falta algún embedding: M = 0 y se reparte su peso entre los demás. | 0,20 |
| **Experiencia E** | meses de experiencias que usan habilidades del perfil, min(total/24, 1); bonificación si el tipo de experiencia coincide con el tipo de proyecto (SEMILLERO_INVESTIGACION ↔ investigación). | 0,15 |
| **Disponibilidad A** | DISPONIBLE = 1, PARCIAL = 0,6, NO_DISPONIBLE = 0; × min(horasSemana / minWeeklyHours, 1) si el perfil pide horas. | 0,15 |

`score = 100 · (0,5·S + 0,2·M + 0,15·E + 0,15·A)`, redondeado a 2 decimales. Se guardan los TOP_N por perfil con su `rank`. Pesos configurables (`MATCH_WEIGHTS`) y documentados en el FP-15.

### breakdown (RF13)
```json
{
  "matchedSkills": [{ "skill": "React", "required": "INTERMEDIO", "has": "AVANZADO", "months": 24, "importance": "ALTA", "points": 0.92 }],
  "missingSkills": [{ "skill": "Docker", "required": "BASICO", "importance": "MEDIA" }],
  "experience": { "relevantMonths": 18, "items": ["Semillero SIMI – Desarrollador (20 meses)"] },
  "availability": { "status": "PARCIAL", "weeklyHours": 10, "requiredHours": 12 },
  "semantic": { "similarity": 0.81 },
  "weights": { "skills": 0.5, "semantic": 0.2, "experience": 0.15, "availability": 0.15 }
}
```
Sin datos sensibles en el breakdown (no se guarda correo ni teléfono; se muestran nombre, programa, tipo de persona).

---

## 6. Embeddings de colaboradores

- Texto del perfil: resumen + habilidades (“React, nivel Avanzado, 24 meses”) + experiencias (rol, organización, tecnologías). Sin correo ni datos de contacto.
- Se recalcula: al crear/editar perfil, habilidades o experiencia (caso de uso marca `embeddingUpdatedAt = null`) y al importar desde Excel.
- `POST /admin/embeddings/rebuild` (ADMIN): recalcula en lotes de 50 los colaboradores sin embedding o desactualizados. También se ejecuta al inicio de `POST /projects/:id/recommendations` para los que falten.
- Con `AI_PROVIDER=fake` el embedding es determinístico (hash de palabras) para que los tests sean estables.

---

## 7. Endpoints

| Método y ruta | Rol | Respuesta / errores |
|---|---|---|
| `POST /projects/:id/analysis` | LIDER dueño | 201 análisis con perfiles · 403 no es dueño · 409 análisis en curso · 422 proyecto incompleto · 503 IA no disponible |
| `GET /projects/:id/analysis` | LIDER dueño, ADMIN | último análisis COMPLETADO + perfiles activos (IA y manuales) · 404 sin análisis |
| `GET /projects/:id/analyses` | LIDER dueño, ADMIN | historial (fecha, estado, modelo) |
| `POST /projects/:id/required-profiles` | LIDER dueño | crea perfil `MANUAL` con habilidades del catálogo |
| `PATCH /projects/:id/required-profiles/:profileId` | LIDER dueño | editar nombre, habilidades, nivel, importancia; `active=false` para descartar |
| `POST /projects/:id/recommendations` | LIDER dueño | calcula y guarda para todos los perfiles activos · 409 si no hay análisis |
| `GET /projects/:id/recommendations?profileId=&includeUnavailable=` | LIDER dueño, ADMIN | lista ordenada por perfil (rank, score, nombre, programa, tipo de persona, disponibilidad, si tiene usuario) |
| `GET /projects/:id/recommendations/:recommendationId` | LIDER dueño, ADMIN | detalle con `breakdown` (RF13) |
| `POST /admin/embeddings/rebuild` | ADMIN | 200 `{ processed, skipped, failed, remaining }` · cuerpo opcional `{ force?, limit? }` (ver §12) |

Módulos: `AnalysisModule` (RF8–RF10) y completar `MatchmakingModule` (RF11–RF13). Casos de uso: `RequestProjectAnalysisUseCase`, `GetProjectAnalysisUseCase`, `ManageRequiredProfileUseCase`, `GenerateRecommendationsUseCase`, `ListRecommendationsUseCase`, `GetRecommendationDetailUseCase`, `RebuildEmbeddingsUseCase`. El cálculo del puntaje va en una función **pura de dominio** (`domain/services/match-score.ts`) con pruebas unitarias exhaustivas.

---

## 8. Frontend

Las pantallas `/proyectos/analisis` y `/proyectos/recomendaciones` hoy son maquetas con datos quemados. Pasan a ser rutas por proyecto:

- `/proyectos/[id]/analisis`: botón “Analizar con IA” (estado de carga, error 503 con reintento), resumen, tarjetas `RequiredProfileCard` con prioridad, cantidad, habilidades (chip por tipo y nivel mínimo, “no catalogada” en gris), **justificación** (RF10) y etiqueta **IA / Manual** (HU-09). Agregar/editar perfil manual con `SkillPicker`.
- `/proyectos/[id]/recomendaciones`: selector de perfil, botón “Generar recomendaciones”, lista ordenada con barra de puntaje, disponibilidad y si la persona tiene usuario; filtro “incluir no disponibles”.
- Panel/modal “¿Por qué?” (RF13): habilidades que coinciden (requerido vs. tiene, meses), faltantes, experiencia relevante, disponibilidad, afinidad semántica y los pesos usados.
- Desde el detalle de proyecto: acciones “Analizar” y “Ver recomendaciones” según el estado (`BORRADOR`, `ANALIZADO`).
- Hooks: `useProjectAnalysis`, `useRequiredProfiles`, `useRecommendations`. Tipos en `src/types` según los DTO de §7.

---

## 9. Pruebas

- Unitarias: `match-score` (casos: sin habilidades, nivel inferior/superior, sinónimo, sin embedding, no disponible, pesos personalizados), mapeo al catálogo, validación de la salida de Gemini, casos de uso con `Fake*`.
- Integración: endpoints con `AI_PROVIDER=fake`; 403/409/422/503.
- Seed de demo: 2 proyectos de ejemplo y ≥ 20 colaboradores (o la plantilla Excel de prueba) para que las recomendaciones tengan sentido en la sesión con la cliente.
- Aceptación (FP-15 4.1): RF8–RF13 por partes con la cliente (sesión 1: RF8–RF10 el 29/10; sesión 2: RF11–RF13 el 04/11; sesión 3: repruebas y Acta No. 4 el 05/11).

---

## 10. Orden sugerido (alineado a la línea base 1)

1. 16/10–21/10 — Migración, entidades, puertos IA con `Fake`, `GeminiProjectAnalyzer`, `POST/GET analysis` (RF8–RF10) + pantalla de análisis.
2. 22/10–26/10 — Perfiles manuales, embeddings de perfiles y colaboradores, `rebuild`.
3. 27/10–30/10 — `match-score`, recomendaciones, detalle (RF11–RF13) + pantallas.
4. 03/11 — Despliegue (variables en Render, extensión vector en Neon, migración) y seed de demo.

---

## 11. Relación con `plan-iteracion-2.md` (qué se toma y qué cambia)

Este documento **reemplaza** las decisiones de diseño del plan donde no coinciden; el resto del plan sigue vigente.

| Tema | Plan (15/10) | Decisión vigente (este documento) |
|---|---|---|
| pgvector / embeddings (RT11) | No incorporar en el PMV | **Sí**: matchmaking híbrido, la parte semántica pesa 20 % y es apagable (si falta el embedding su peso se reparte). Justificación RT12: mejora coincidencias cuando la IA o la persona usan términos distintos al catálogo; costo marginal (embeddings de Gemini). |
| Pesos del puntaje | 60/15/10/15 sin semántica | 50 habilidades (incluye profundidad en meses) / 20 semántica / 15 experiencia / 15 disponibilidad. Calibrar con el dataset la semana del 26/10. |
| Edición de perfiles por el líder | No en esta iteración | **Mínima**: descartar perfil (`active=false`) y agregar perfil `MANUAL`, porque RF9 pide distinguir lo identificado por la IA de lo agregado manualmente. Si no alcanza el tiempo, se deja solo "descartar". |
| Ejecución del análisis | 202 asíncrono o síncrono | Síncrono (201). Con Gemini real tarda 15–45 s: el backend da 55 s por llamada y el front espera hasta 60 s. Si algún día no alcanza, pasar a 202 + polling. |
| Pruebas con la cliente | 04/11 o 05/11 | Por partes según LB1: 29/10 (RF8–RF10), 04/11 (RF11–RF13), 05/11 (repruebas y Acta No. 4). |

Se adoptan del plan, y se suman a este diseño:
- **RT7:** máximo 5 análisis por proyecto al día (409 con mensaje claro), tope de tokens de salida y registro de `inputTokens`/`outputTokens` por análisis (columnas en `project_analyses`) para el costo de RT12.
- **Catálogo ampliado a ~80 habilidades** (técnicas y blandas, con sinónimos) en el seed antes de probar con Gemini.
- **Análisis desactualizado:** `GET /projects/:id/analysis` devuelve `outdated: true` cuando el proyecto cambió desde el análisis (se compara una huella de lo que la IA vio, no `updatedAt`, porque los cambios de estado también lo modifican). Mostrar "El proyecto cambió desde el último análisis".
- **Privacidad:** la respuesta de recomendaciones nunca expone correo ni teléfono; solo nombre, programa, grupo, tipo de persona, disponibilidad y habilidades.
- **Dataset ficticio de 30–40 personas** (plantilla Excel) para calibrar y para la demo, marcado claramente como datos de prueba.
- `AI_PROVIDER=fake` listo como respaldo el día de la prueba.

---

## 12. Contrato implementado (estado al 16/10/2026)

Esta sección es la referencia exacta para el front: lo que ya responde el backend. Prefijo de todas las rutas: `/api`. Errores: `{ "statusCode": number, "message": string }`. Autenticación: `Authorization: Bearer <access_token>`.

### Estado

| Pieza | Estado |
|---|---|
| `POST /projects/:id/analysis`, `GET /projects/:id/analysis`, `GET /projects/:id/analyses` (RF8–RF10) | ✅ Implementado y probado con Gemini real |
| `POST /projects/:id/required-profiles`, `PATCH /projects/:id/required-profiles/:profileId` (RF9) | ✅ Implementado |
| `POST /admin/embeddings/rebuild` | ✅ Implementado |
| `POST/GET /projects/:id/recommendations…` (RF11–RF13) | ✅ Implementado y probado con datos reales (ver "Recomendaciones" más abajo) |
| Catálogo de habilidades | ✅ 87 habilidades ACTIVAS (58 conocimientos, 10 competencias, 19 blandas) |

### Tiempos y errores de la IA (importante para el front)

- `POST /projects/:id/analysis` es **síncrono**. Con Gemini real tarda típicamente 15–45 s (con `AI_PROVIDER=fake`, menos de 1 s). El front debe usar un **timeout de 60 s solo para esta petición** (el global de 15 s no alcanza). El backend **nunca pasa de `AI_TIMEOUT_MS` (55 s)** en total: ese presupuesto se reparte entre Gemini, sus reintentos, el modelo de respaldo y los embeddings (estos con tope propio de `EMBEDDING_TIMEOUT_MS`, 10 s; si no alcanzan, el análisis se guarda igual y la parte semántica se completa al generar recomendaciones).
- **Análisis interrumpido** (reinicio del servidor a mitad de camino): si un intento sigue `PENDIENTE` más de `AI_TIMEOUT_MS` + 60 s, se cierra como `ERROR` con `errorMessage: "El análisis se interrumpió antes de terminar."` y el proyecto sale de `EN_ANALISIS` (vuelve a `ANALIZADO` si tenía un análisis completado, si no a `BORRADOR`). Ocurre al arrancar el backend, cada minuto y en `GET …/analysis` / `GET …/analyses`. El front no tiene que hacer nada especial: al recargar la pantalla el proyecto ya no aparece colgado.
- `503` con `"El análisis tardó demasiado y se canceló. Intenta de nuevo."`: la IA respondió pero el intento ya se había dado por interrumpido; se trata igual que el otro 503 (mensaje + "Reintentar").
- El 503 de este endpoint (`"El servicio de análisis no está disponible. Intenta de nuevo en unos minutos."`) significa que **la IA** falló, no que el servidor esté dormido: **no debe activar el aviso global "el servidor está despertando"** ni el reintento de `/health`. Mostrar el mensaje en la pantalla de análisis con un botón "Reintentar". El proyecto vuelve a su estado anterior y el intento queda en el historial con `status: "ERROR"`.
- Si la petición se corta por timeout del navegador sin respuesta, el análisis puede haber terminado igual en el servidor: antes de mostrar error, consultar `GET /projects/:id/analysis` (o `GET /projects/:id/analyses`) una vez.
- Si `GEMINI_MODEL` sigue saturado (5xx tras sus reintentos) o responde 429 (cuota; un 429 no se reintenta sobre el mismo modelo), el backend prueba una vez con el modelo de respaldo dentro del mismo presupuesto de tiempo; el 503 solo llega si ambos fallan. En ese caso `model` del análisis trae el modelo de respaldo (p. ej. `gemini-3.5-flash-lite`): es informativo, el front no necesita tratarlo distinto. Se eligió un modelo *lite* porque en las pruebas del 16/10 los demás *flash* también daban 503 en los picos; a cambio, sus perfiles suelen ser menos detallados.
- `409` en `POST …/analysis`: ya hay un análisis en curso (se libera solo a los 4 min) o se llegó al máximo de **5 análisis por día por proyecto** (desde el 16/10 cuentan **todos** los intentos, también los que terminaron en `ERROR`); el `message` ya viene redactado para mostrarse.
- `503` con `"El servicio de análisis alcanzó su límite de uso por hoy. Intenta de nuevo más tarde."`: la cuota diaria de Gemini está agotada en el modelo principal y en el de respaldo. No se crea intento ni se gasta el límite del proyecto; el backend vuelve a probar la cuota cada 30 min (o al reiniciarse). Se trata igual que el otro 503 (mensaje + "Reintentar").
- Mientras el análisis corre, el proyecto pasa a `EN_ANALISIS`; al terminar, a `ANALIZADO`. Bloquear el botón mientras dure la petición.

### `POST /projects/:id/analysis` — LIDER dueño

Sin cuerpo. **201**:
```json
{
  "id": "uuid", "projectId": "uuid",
  "status": "COMPLETADO",
  "provider": "gemini", "model": "gemini-3.8-flash", "promptVersion": "v1",
  "summary": "Propuesta de perfiles para …",
  "errorMessage": null,
  "durationMs": 18773, "inputTokens": 1405, "outputTokens": 1007,
  "createdAt": "ISO", "completedAt": "ISO",
  "outdated": false,
  "profiles": [ /* RequiredProfile, ver abajo */ ]
}
```
Errores: 401 · 403 (no es el dueño) · 404 (proyecto inexistente) · 409 · 422 (`"El proyecto necesita título, resumen y objetivos para poder analizarse."`) · 503.

### `GET /projects/:id/analysis` — LIDER dueño o ADMIN

Mismo cuerpo que el 201 de arriba (último análisis `COMPLETADO`, con los perfiles activos de ese análisis **más** los manuales). **404** `"Este proyecto aún no tiene un análisis."` si no hay ninguno. `outdated: true` ⇒ mostrar el aviso de análisis desactualizado con botón "Volver a analizar".

### `GET /projects/:id/analyses?page=1&pageSize=20` — LIDER dueño o ADMIN

```json
{
  "analyses": [
    { "id": "uuid", "projectId": "uuid", "status": "PENDIENTE | COMPLETADO | ERROR",
      "provider": "gemini", "model": "gemini-3.8-flash", "promptVersion": "v1",
      "summary": "…", "errorMessage": null, "durationMs": 18773,
      "inputTokens": 1405, "outputTokens": 1007, "createdAt": "ISO", "completedAt": "ISO" }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```
Del más reciente al más antiguo. No incluye perfiles (para eso, `GET …/analysis`).

### RequiredProfile (dentro de `profiles`)

```json
{
  "id": "uuid",
  "source": "IA | MANUAL",
  "name": "Desarrollador de Hardware e IoT",
  "description": "…",
  "justification": "Por qué el proyecto necesita este perfil (RF10). En los MANUAL puede ser ''.",
  "quantity": 1,
  "priority": "ALTA | MEDIA | BAJA",
  "minWeeklyHours": 10,
  "position": 0,
  "active": true,
  "skills": [
    { "id": "uuid", "skillId": "uuid | null", "name": "Arduino", "catalogued": true,
      "type": "CONOCIMIENTO | COMPETENCIA | HABILIDAD_BLANDA",
      "minLevel": "BASICO | INTERMEDIO | AVANZADO | EXPERTO",
      "importance": "ALTA | MEDIA | BAJA" }
  ]
}
```
`catalogued: false` (⇒ `skillId: null`) = la IA propuso algo que no está en el catálogo: mostrarlo en gris como "no catalogada". Los perfiles descartados (`active: false`) no vuelven en `GET …/analysis`. `minWeeklyHours` puede ser `null`. Para separar habilidades blandas de técnicas usar `type` (mismo criterio que `groupBySoftSkill` del front).

### `POST /projects/:id/required-profiles` — LIDER dueño (perfil MANUAL)

```json
{
  "name": "Diseñador de interfaces",
  "description": "…",
  "justification": "…",
  "quantity": 1,
  "priority": "MEDIA",
  "minWeeklyHours": 6,
  "skills": [ { "skillId": "uuid", "minLevel": "INTERMEDIO", "importance": "ALTA" } ]
}
```
Límites: `name` obligatorio, máx. 120; `description` y `justification` opcionales, máx. 2000; `quantity` 1–10; `minWeeklyHours` opcional 1–60; `skills` 1–8 del catálogo ACTIVO, sin repetir. **201** con un `RequiredProfile` (`source: "MANUAL"`, al final de la lista). Errores: 403 · 404 (`"Habilidad no encontrada"`: no existe o está pendiente de aprobación) · 422 (validación o `"Hay habilidades repetidas en el perfil."`). Las habilidades se eligen con `GET /catalogs/skills?q=` (el `SkillPicker` actual); el tipo lo fija el catálogo.

### `PATCH /projects/:id/required-profiles/:profileId` — LIDER dueño

Todos los campos opcionales (los mismos de arriba más `active: boolean`). `skills`, si viene, **reemplaza la lista completa**. `description: null` o `""` lo vacía. `{ "active": false }` descarta el perfil. Sirve también para perfiles de la IA. **200** con el `RequiredProfile` actualizado · 403 · 404 (`"Perfil no encontrado"`) · 422.

### `POST /admin/embeddings/rebuild` — ADMIN

Cuerpo opcional `{ "force": false, "limit": 200 }` (`limit` 1–500). **200** `{ "processed": 61, "skipped": 3, "failed": 0, "remaining": 0, "requiredProfiles": { "processed": 4, "failed": 0, "remaining": 0 } }` (los primeros campos son de personas; `requiredProfiles`, de los perfiles requeridos activos). Si algún `remaining > 0`, volver a llamar. Cada embedding guarda el modelo que lo generó (`embeddingModel`, p. ej. `gemini/gemini-embedding-001@768`): los de otro modelo o proveedor se ignoran en el puntaje (su peso se reparte) y se regeneran solos al generar recomendaciones o con este endpoint. `force: true` invalida todos, de personas y de perfiles. No hay pantalla para esto en el MVP; si se quiere, un botón en el panel del ADMIN.

### Recomendaciones (RF11–RF13) — implementadas el 16/10/2026

Base: `/api/projects/:id/recommendations`. Candidatas: personas **activas y con consentimiento de datos** (`dataConsent`), con o sin usuario; nunca el propio líder del proyecto. Se comparan contra los perfiles **activos** del último análisis más los manuales. Por perfil se guardan las mejores `MATCH_TOP_N` (10 por defecto); quien no comparte ninguna habilidad ni tiene experiencia relevante con el perfil no se recomienda.

**Puntaje** (0–100) = 100 · (0,5·S + 0,2·M + 0,15·E + 0,15·A), con los pesos de `MATCH_WEIGHTS`:

| Componente | Cálculo (0–1) |
|---|---|
| S · habilidades | Σ importancia·nivel·profundidad / Σ importancia. Importancia ALTA 3, MEDIA 2, BAJA 1. Nivel = min(nivel de la persona / nivel mínimo, 1) con BÁSICO=1…EXPERTO=4 (0 si no la tiene). Profundidad = 0,7 + 0,3·min(meses/24, 1). Coincide por `skillId` o, si la habilidad del perfil no está catalogada, por nombre/sinónimo. |
| M · semántica | Coseno entre el embedding del perfil y el de la persona, reescalado de [0,5 – 0,85] a [0 – 1]. Si falta algún embedding, M no cuenta y su peso se reparte entre los demás. |
| E · experiencia | min(meses de experiencias que usaron tecnologías del perfil / 24, 1) + 0,2 si alguna de ellas es del tipo que equivale al proyecto (investigación ↔ semillero), tope 1. |
| A · disponibilidad | DISPONIBLE 1, PARCIAL 0,6, NO_DISPONIBLE 0, multiplicado por min(horas/semana que ofrece / horas mínimas del perfil, 1) si el perfil pide horas. |

La lista de cada perfil sale ordenada por puntaje (desempate: más habilidades, luego apellido). El `rank` guardado puede tener huecos al filtrar por disponibilidad.

#### `POST /projects/:id/recommendations` — LIDER dueño

Cuerpo opcional `{ "includeUnavailable": false }` (incluye en el cálculo a quienes hoy figuran NO_DISPONIBLE). **Reemplaza** todas las recomendaciones anteriores del proyecto. Antes de calcular actualiza los embeddings de personas que falten, por eso la primera vez tras muchos cambios puede tardar unos segundos (normalmente 1–3 s; usar el timeout de 60 s). **200** con el mismo cuerpo que el `GET` de abajo. Errores: 403 · 404 · 409 (`"Primero analiza el proyecto con IA para obtener los perfiles requeridos."` o `"El proyecto no tiene perfiles requeridos activos."`).

#### `GET /projects/:id/recommendations?profileId=&includeUnavailable=` — LIDER dueño o ADMIN

```json
{
  "projectId": "uuid",
  "generatedAt": "ISO | null",
  "includeUnavailable": false,
  "profiles": [
    {
      "profileId": "uuid", "name": "Analista de Datos y Alertas", "source": "IA | MANUAL",
      "quantity": 1, "priority": "ALTA",
      "recommendations": [
        {
          "id": "uuid", "rank": 1, "score": 51.13,
          "components": { "skills": 0.5182, "semantic": 0.5109, "experience": 0, "availability": 1 },
          "matchedSkillCount": 2, "requiredSkillCount": 4,
          "collaborator": {
            "id": "uuid", "fullName": "Sara Ayala",
            "personType": "ESTUDIANTE | DOCENTE | EGRESADO | …",
            "programName": "Estadística", "researchGroup": "… | null",
            "availabilityStatus": "DISPONIBLE | PARCIAL | NO_DISPONIBLE",
            "weeklyHours": 10, "hasUser": true
          }
        }
      ]
    }
  ]
}
```
Todos los perfiles activos aparecen (con `recommendations: []` si nadie coincide o aún no se generó; `generatedAt: null` si nunca se generó). `includeUnavailable=false` (por defecto) oculta a quienes **hoy** estén NO_DISPONIBLE; `true` los muestra, pero solo existirán si la generación también se hizo con `includeUnavailable: true`. `profileId` filtra a un perfil (404 si no es un perfil activo del proyecto). `includeUnavailable` debe ser `true` o `false` (422 con otro valor). `hasUser: false` = la persona existe sin cuenta (importada): no se le puede escribir desde la plataforma. **Nunca** viajan correo, teléfono ni enlaces de la persona.

#### `GET /projects/:id/recommendations/:recommendationId` — LIDER dueño o ADMIN (RF13)

```json
{
  "id": "uuid", "rank": 1, "score": 51.13,
  "components": { "skills": 0.5182, "semantic": 0.5109, "experience": 0, "availability": 1 },
  "breakdown": {
    "matchedSkills": [ { "skill": "Análisis de datos", "required": "INTERMEDIO", "has": "AVANZADO", "months": 20, "importance": "ALTA", "points": 0.95 } ],
    "missingSkills": [ { "skill": "Python", "required": "INTERMEDIO", "importance": "ALTA" } ],
    "experience": { "relevantMonths": 18, "items": ["Desarrollador – Semillero SIMI (18 meses)"] },
    "availability": { "status": "DISPONIBLE", "weeklyHours": 10, "requiredHours": 8 },
    "semantic": { "similarity": 0.679 },
    "weights": { "skills": 0.5, "semantic": 0.2, "experience": 0.15, "availability": 0.15 }
  },
  "generatedAt": "ISO",
  "profile": { "id": "uuid", "name": "…", "source": "IA | MANUAL", "quantity": 1, "priority": "ALTA" },
  "collaborator": { /* igual que en la lista */ }
}
```
`points` va de 0 a 1 (nivel × profundidad). `semantic.similarity` es el coseno crudo (null si falta un embedding); en ese caso `weights.semantic` es 0 y el resto suma 1. `weights` son los pesos **realmente aplicados**: mostrarlos como "cómo se calculó". 404 si la recomendación no existe o es de otro proyecto.

Las recomendaciones **no se recalculan solas**: si el líder edita o descarta perfiles, o cambian las personas, debe volver a pulsar "Generar recomendaciones". Conviene mostrar `generatedAt` y, tras editar perfiles, invitar a regenerar.

### Variables de entorno (backend)

`AI_PROVIDER` (`fake` por defecto | `gemini`), `GEMINI_API_KEY` (obligatoria con `gemini`; nunca en el front), `GEMINI_MODEL` (`gemini-3.8-flash`), `GEMINI_FALLBACK_MODEL` (`gemini-3.5-flash-lite`; vacío desactiva el respaldo), `GEMINI_EMBEDDING_MODEL` (`gemini-embedding-001`), `EMBEDDING_DIM` (768), `AI_TIMEOUT_MS` (55000, presupuesto total del análisis), `EMBEDDING_TIMEOUT_MS` (10000), `MATCH_WEIGHTS` ("habilidades,semántica,experiencia,disponibilidad"; se normalizan a suma 1; inválido ⇒ 0.5,0.2,0.15,0.15), `MATCH_TOP_N` (1–50, por defecto 10). En Render hay que definirlas y correr `npm run migration:run` (`AddAnalysisAndMatchmaking` instala la extensión `vector` y `AddEmbeddingModel` agrega `embeddingModel`; si Neon no deja crearla, habilitarla desde su panel).

### Cómo probar sin gastar IA

`AI_PROVIDER=fake` devuelve siempre 2 perfiles deterministas con habilidades del catálogo (instantáneo). Los logins de prueba (`laura.mendez@conectau.test`, `admin@conectau.test`, contraseña `Test1234!` del seed) y la colección Postman (`postman/`, carpetas *AI Analysis (Líder)*, *Recommendations (Líder)* y *Embeddings (Admin)*) están en el README del backend.
