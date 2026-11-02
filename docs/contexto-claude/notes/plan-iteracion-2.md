# Plan de trabajo — Iteración 2 (Corte Tres) · PMV con innovación
### HU-08 a HU-12 · RF8–RF13 · entrega **viernes 06/11/2026** (hito H2)
_Elaborado: 15/10/2026 · base: Alcance v2.0, EDT 1.5, estado real de `conecta-u-back` y `conecta-u`_

**Leyenda:** `[ ]` pendiente · `[~]` en curso · `[x]` hecho · ⚠️ decisión que hay que tomar antes de construir.


> **Actualización 15/10:** se eligió matchmaking **híbrido con embeddings (pgvector)** y Gemini. El diseño vigente está en `backend-iteracion-2.md`; su §11 dice qué decisiones de este plan cambian (pgvector, pesos, perfiles manuales, fechas de prueba).

---

## 1. Qué hay que entregar

| HU | Nombre | Prioridad | RF | Qué significa en el producto |
|---|---|---|---|---|
| HU-08 | Analizar proyecto mediante IA | 5 (Alta)* | **RF8** Solicitar análisis mediante IA | Botón "Analizar con IA" en el proyecto; el líder lo pide y ve el estado (analizando / listo / falló). |
| HU-09 | Identificar perfiles requeridos | 5 (Alta)* | **RF9** Presentar perfiles requeridos (técnicos y habilidades blandas) | La IA devuelve N perfiles; cada uno con habilidades técnicas y blandas **del catálogo**, nivel mínimo, cantidad de personas y prioridad. |
| HU-10 | Consultar justificación de perfil | 3 (Media)* | **RF10** Justificación por perfil | Cada perfil explica por qué el proyecto lo necesita, citando resumen/objetivos/entregables. |
| HU-11 | Recomendar colaboradores | 5 (Alta)* | **RF11** Comparar perfiles con personas (con o sin usuario) · **RF12** Lista de personas recomendadas | Por cada perfil, ranking de personas con puntaje de afinidad (0–100), filtrable por perfil. |
| HU-12 | Consultar justificación de recomendación | 5 (Alta)* | **RF13** Elementos del perfil que sustentan la recomendación | Por cada persona: habilidades que coinciden (con nivel y meses), las que faltan, experiencia relacionada y disponibilidad. |

\* Combinación Valor/Costo/Riesgo fuera de la tabla de priorización: sigue pendiente confirmarlo con la docente (viene de la Iteración 1).

**Requisitos no funcionales y técnicos que se evalúan en este corte:** RNF6 (fallo controlado de la IA), RNF8 (trazabilidad: perfiles y recomendaciones explican su origen), RNF5 (privacidad de las personas recomendadas), RT5 (IA por API, Gemini u OpenAI), RT6 (matchmaking contra las personas), RT7 (límites de consumo, costos y errores), RT11 (evaluar pgvector) y RT12 (justificación técnica y económica).

---

## 2. Evaluación de las HU y RF

### Lo que está bien planteado
- **RF8–RF10 son una sola operación técnica**: una llamada a la IA devuelve los perfiles y su justificación juntos. Conviene diseñarlos y probarlos como un bloque, aunque se documenten como tres RF.
- **RF11–RF13 tampoco necesitan IA.** Un algoritmo determinista (reglas + pesos) sobre lo que ya guarda el perfil técnico (habilidad del catálogo, nivel 1–4, meses, último uso, experiencia, disponibilidad) es explicable por construcción, y eso es justamente lo que pide RF13/RNF8. También es gratis, rápido y reproducible para las pruebas con la cliente.
- **La Iteración 1 dejó la base que el matchmaking necesita**: catálogo de habilidades con sinónimos, nivel y meses por habilidad, tecnologías por experiencia, disponibilidad numérica y personas sin usuario (importación Excel).

### Huecos y riesgos que hay que cerrar
1. **⚠️ La IA tiene que devolver habilidades del catálogo, no texto libre.** Si dice "ReactJS" o "trabajo colaborativo" y no se resuelve contra `skills`, el matchmaking no encuentra a nadie. Propuesta: pasar el catálogo en el prompt, exigir salida JSON con esquema y resolver cada habilidad con `normalizeSkillName` + sinónimos. Lo que no tenga equivalente se muestra como "sin equivalente en el catálogo", sin crearse sola en el catálogo (decisión 2).
2. **El catálogo es chico (38 habilidades) para un análisis real.** El documento técnico pedía ~80, con habilidades blandas. Ampliarlo en el seed es barato y mejora mucho los resultados.
3. **Faltan datos para validar el matchmaking.** El seed tiene 9 colaboradores y está pendiente desde la Iteración 1 llenar la plantilla con ≥ 20 personas ficticias. El alcance dice que la Iteración 2 "se valida con las hojas de vida cargadas desde Excel": sin ese dataset no hay cómo calibrar ni demostrar.
4. **⚠️ "El sistema sugiere, el líder decide."** Ningún RF dice si el líder puede **editar** los perfiles que propone la IA (quitar uno, cambiar el nivel) antes del matchmaking. Si se agrega, es trabajo extra fuera de los RF aprobados. Propuesta: **no** editar en esta iteración; el líder puede volver a analizar y elige a quién convocar en la Iteración 3. Confirmarlo con la cliente.
5. **⚠️ Privacidad (Ley 1581, RNF5).** Recomendar a alguien expone su perfil al líder. Propuesta: solo se recomiendan personas **activas y con autorización de datos** (`dataConsent = true`). Las importadas la traen; las registradas sin autorizar quedan fuera.
6. **Análisis desactualizado.** Si el líder edita el proyecto después de analizarlo, los perfiles ya no corresponden. Propuesta: guardar la fecha del análisis y mostrar "El proyecto cambió desde el último análisis" cuando `project.updatedAt` sea posterior.
7. **RT7 sin definir.** Hacen falta números concretos: tiempo máximo de espera, reintentos, tope de análisis por proyecto y por día, y registro de tokens por análisis (para el costo de RT12).
8. **RT11 (pgvector).** Con habilidades del catálogo y sinónimos, la coincidencia es exacta y no necesita embeddings. La recomendación para el documento es **no** incorporar pgvector en el PMV y dejar escrita la justificación (RT12).
9. **Cronograma ajustado.** La EDT 1.5 suma 20 días (5+4+2+6+2+1). Desde hoy hasta el 06/11 hay **16 días hábiles**, porque el 02/11 es festivo. Las mitigaciones son las de arriba: matchmaking por reglas, justificación de recomendación armada con plantilla (sin IA), un adaptador de IA falso para desarrollo y pruebas, y reutilizar las maquetas del frontend.

### Decisiones que necesito de ti (o de la cliente) antes de empezar
| # | Decisión | Propuesta |
|---|---|---|
| 1 | Proveedor de IA (RT5) | **Gemini** (modelo Flash, salida estructurada JSON). Tiene un nivel gratuito que cubre el desarrollo y las pruebas, y el presupuesto de $100.000/mes del alcance alcanza de sobra. Se deja detrás de un puerto, así que cambiar a OpenAI es solo cambiar el adaptador. |
| 2 | Habilidades que la IA propone y no están en el catálogo | Se muestran en el perfil como "sin equivalente en el catálogo" y **no** se crean solas. El ADMIN puede agregarlas al catálogo (RF18). |
| 3 | ¿El líder edita perfiles? | No en esta iteración (ver hueco 4). |
| 4 | ¿A quién se recomienda? | Personas activas con autorización de datos, con o sin usuario. Se excluye al propio líder. |
| 5 | ¿Cuántas recomendaciones? | Top 5 por perfil con puntaje ≥ 40, y "ver más" hasta 10. |
| 6 | Pesos del puntaje | Los de la sección 3.2. Se calibran con el dataset ficticio la semana del 26/10. |

---

## 3. Diseño propuesto (resumen)

### 3.1 Análisis con IA (RF8–RF10)
- **Puerto en el dominio** `ProjectAnalyzer.analyze(input) → { profiles[], usage }`, con el adaptador `GeminiProjectAnalyzer` en `infrastructure/ai` y un `FakeProjectAnalyzer` determinista que se elige por variable de entorno (`AI_PROVIDER=gemini|fake`). El falso sirve para desarrollo, tests, demo sin cuota y como plan B el día de la prueba.
- **Entrada del prompt:** título, resumen, objetivos, tipo y categoría, campos de la plantilla del tipo, entregables, habilidades conocidas y la lista de habilidades del catálogo (nombre, tipo y categoría).
- **Salida (esquema JSON):** por perfil, `title`, `kind` (TECNICO / BLANDO / MIXTO), `headcount`, `priority` (ALTA / MEDIA / BAJA), `justification` y `skills[{ name, type, minLevel }]`. Se valida con el mismo criterio de los DTO; si el JSON viene mal, se reintenta una vez y si no, el análisis queda FALLIDO.
- **Persistencia (migración nueva):**
  - `project_analyses`: `id`, `projectId`, `status` (EN_CURSO / COMPLETADO / FALLIDO), `provider`, `model`, `promptVersion`, `inputTokens`, `outputTokens`, `errorMessage`, `createdAt`, `completedAt`.
  - `required_profiles`: `analysisId`, `title`, `kind`, `headcount`, `priority`, `justification`, `position`.
  - `required_profile_skills`: `profileId`, `skillId` nullable, `rawName`, `type`, `minLevel`.
  - Se guarda el historial (RNF8). El proyecto pasa a `EN_ANALISIS` y luego a `ANALIZADO`; esos estados ya existen en `ProjectStatus`.
- **API:**
  - `POST /projects/:id/analysis` (LIDER dueño): responde 202 con el análisis en curso y lo procesa en segundo plano. Si se prefiere simple y tarda menos de 20 s, puede ser síncrono.
  - `GET /projects/:id/analysis`: el último análisis con perfiles y justificaciones.
  - `GET /projects/:id/analyses`: el historial.
  - El ADMIN puede leerlos.
- **RT7:** timeout de 30 s, 1 reintento con espera, máximo 5 análisis por proyecto al día (409 con mensaje claro al pasarse), tope de tokens de salida y uso registrado por análisis. Un fallo de la IA no tumba nada: el análisis queda FALLIDO con mensaje en español y botón "Reintentar" (RNF6).

### 3.2 Matchmaking y recomendación (RF11–RF13)
- **Caso de uso** `RecommendCollaborators(projectId)`: toma el último análisis COMPLETADO y, por cada perfil, puntúa a todas las personas elegibles (decisión 4).
- **Puntaje 0–100 por persona y perfil** (pesos iniciales, a calibrar):
  - **60 % cobertura de habilidades**: por cada habilidad requerida, el aporte es mínimo entre 1 y nivel de la persona ÷ nivel mínimo requerido. Si no la tiene, aporta 0.
  - **15 % profundidad**: meses de experiencia en esas habilidades (tope de 24 meses) y uso reciente (último año de uso).
  - **10 % experiencia relacionada**: experiencias cuyas tecnologías incluyen habilidades del perfil.
  - **15 % disponibilidad**: DISPONIBLE pesa 1, PARCIAL 0,6 y NO_DISPONIBLE 0, por horas semanales frente a una referencia de 10 h. "No disponible" no se excluye: baja en el ranking y se muestra.
  - Las habilidades blandas cuentan en la cobertura igual que las técnicas: el alcance v2.0 las exige en el matchmaking.
- **Justificación (RF13)** armada con plantilla a partir del desglose, sin IA: habilidades que coinciden (nivel y meses), las que faltan, la experiencia relacionada y la disponibilidad. Calza con la forma de `RecommendationCard` (prefijo / destacado / sufijo).
- **Persistencia:** `recommendations` (`analysisId`, `profileId`, `collaboratorId`, `score`, `breakdown` jsonb, `createdAt`). RT4 incluye "resultados de recomendación", y además sirve de base para la convocatoria de la Iteración 3.
- **API:** `POST /projects/:id/recommendations` (recalcula) y `GET /projects/:id/recommendations?profileId=` (lista con desglose y paginación). Respuestas solo a través de mappers: la persona expone nombre, programa, grupo, disponibilidad y habilidades, nunca correo (privacidad: el correo se usa recién en la convocatoria).

### 3.3 Frontend
- En el detalle del proyecto: botón "Analizar con IA" (y "Volver a analizar"), con estado y aviso de análisis desactualizado.
- `/proyectos/[id]/analisis`: conectar la maqueta. `RequiredProfileCard` con prioridad, cantidad, justificación, habilidades (y las "sin equivalente") y nivel mínimo. Spinner mientras está EN_CURSO y error con "Reintentar".
- `/proyectos/[id]/recomendaciones`: conectar la maqueta. Filtros por perfil (los chips ya existen), `RecommendationCard` con puntaje, desglose y disponibilidad, y un enlace al perfil de la persona en solo lectura.
- Mover las dos rutas actuales (`/proyectos/analisis`, `/proyectos/recomendaciones`) bajo `[id]` y borrar los datos fijos.

---

## 4. Cronograma (16 días hábiles, 15/10 → 06/11)

> El 02/11 (Todos los Santos, trasladado) es festivo. La documentación avanza en paralelo todos los días: las descripciones de RF (1.4) se escriben **antes** de construir, porque son la especificación.

### Semana 0 · jue 15 – vie 16 oct — cierre y arranque
- [ ] Cerrar lo que quede de la Iteración 1: Acta No. 3 de pruebas firmada, entregables subidos a Drive y migraciones `RestrictProjectLeaderDelete` y `LimitCollaboratorProfileUrl` corridas en Neon/Render.
- [ ] Tomar las decisiones 1–6 y **agendar ya** la prueba de aceptación con la Dra. Judith (propuesta: miércoles 04/11 o jueves 05/11).
- [ ] Crear la cuenta y la clave del proveedor de IA (variable `AI_API_KEY`, nunca en el repo, RT8).
- [ ] Dataset ficticio: plantilla Excel con **30–40 personas** que cubran los perfiles típicos (frontend, backend, datos, UI/UX, gestión, investigación) y varios niveles y disponibilidades.
- [ ] Doc: 1.2 HU-08…HU-12, 1.3 RF8–RF13 y 1.4 tabla de cada RF (flujos normal y alterno, pre y postcondiciones).

### Semana 1 · 19 – 23 oct — análisis con IA (EDT 1.5.1–1.5.3, RF8–RF10)
- [ ] Ampliar el catálogo de habilidades a ~80 (técnicas y blandas, con sinónimos) en el seed.
- [ ] Puerto `ProjectAnalyzer`, adaptadores Gemini y fake, prompt versionado y validación de la salida.
- [ ] Migración y entidades `project_analyses`, `required_profiles` y `required_profile_skills`; resolución de habilidades contra el catálogo.
- [ ] Casos de uso y endpoints de análisis (solicitar, consultar el último, historial), límites de RT7 y estados del proyecto.
- [ ] Specs de cada caso de uso + prueba en vivo con el adaptador real sobre 3 proyectos distintos del seed.
- [ ] Front: botón "Analizar con IA" y página de análisis conectada.
- [ ] Doc: 2.1 modelo lógico y 2.2 diagrama de clases con las tablas y clases nuevas; GUI en Figma de análisis.

### Semana 2 · 26 – 30 oct — matchmaking y recomendación (EDT 1.5.4–1.5.5, RF11–RF13)
- [ ] Puntaje y desglose en el dominio (funciones puras, con specs de cada regla).
- [ ] Migración y entidad `recommendations`; casos de uso y endpoints para recomendar y consultar.
- [ ] Justificación con plantilla (RF13) y mapper sin datos de contacto.
- [ ] **Calibración** con el dataset: revisar a mano 3 proyectos y que el top 3 de cada perfil tenga sentido; ajustar pesos y anotar los finales.
- [ ] Front: página de recomendaciones conectada, con filtros por perfil y desglose.
- [ ] Revisión con el agente `clean-code-reviewer` y corrección de lo que encuentre.
- [ ] Doc: GUI en Figma de recomendaciones; RT11/RT12 (por qué Gemini, por qué no pgvector y costo estimado con los tokens medidos).

### Semana 3 · mar 3 – vie 6 nov — pruebas y entrega (EDT 1.5.6)
- [ ] **Mar 03:** despliegue en Render/Vercel con la clave real y planeación de las pruebas de aceptación de RF8–RF13 (datos de entrada, criterios y resultado esperado).
- [ ] **Mié 04 / jue 05:** ejecución con la cliente, firma por RF, evidencias y **Acta No. 4**. Tener `AI_PROVIDER=fake` listo como respaldo por si la API falla en la reunión.
- [ ] Doc: 3.1 implementación (URL, credenciales), 4 pruebas y 5 usuarios por actor; actualizar el cronograma en MS Project y el FP5 si aplica.
- [ ] Presentación y demo del Corte Tres.
- [ ] **Vie 06:** entrega.

---

## 5. Riesgos y cómo se cubren
| Riesgo | Mitigación |
|---|---|
| La IA devuelve perfiles pobres o habilidades fuera del catálogo | Catálogo en el prompt, salida con esquema, catálogo ampliado y prueba temprana (semana 1) con 3 proyectos reales. |
| Cuota, latencia o caída de la API el día de la prueba | Adaptador falso conmutable, timeout y reintento, análisis guardado (lo ya analizado se muestra sin volver a llamar a la IA). |
| Recomendaciones que no convencen a la cliente | Dataset diseñado con casos claros, calibración con revisión manual y desglose visible para que se entienda el porqué. |
| Falta de tiempo (16 días frente a los 20 de la EDT) | Matchmaking por reglas y justificación con plantilla (sin IA), reutilizar las maquetas, documentación en paralelo, y la Iteración 3 (correo) **en pausa** hasta el 06/11. |
| Exponer datos personales | Solo personas con autorización, sin correo en la recomendación y acceso restringido al líder dueño del proyecto y al ADMIN. |

## 6. Fuera de esta iteración
Edición de perfiles por el líder, convocatoria por correo (RF21–RF22), dashboard y reportes (RF15–RF16), gestión de personas y catálogos (RF17–RF18, adelantada en parte) y embeddings/pgvector.
