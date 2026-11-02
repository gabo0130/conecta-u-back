# Plan de ejecución: Iteración 3 (Examen) + extensión de tesis (PGCS01)

Fecha: 02/11/2026. Úsalo como instrucción en un chat nuevo de Claude Code abierto en los repos (`C:\Proyectos\conecta-u-back` y `C:\Proyectos\conecta-u`).

## 0. Lo que ya existe (sesión en la nube del 02/11)

Ramas en GitHub (creadas desde `develop`; **no** se tocaron `develop`, `master`, Neon ni Render):

| Repo | Rama | Contenido |
|---|---|---|
| `gabo0130/conecta-u-back` | `feature/iteracion-3` | RF4/E8, RF15–RF17, RF21–RF22 + esta carpeta `docs/contexto-claude/` |
| `gabo0130/conecta-u-back` | `feature/tesis-dsr` | Lo anterior + `scripts/synthetic/` (generador de datos sintéticos). **Aquí se trabaja la tesis** |
| `gabo0130/conecta-u` | `feature/iteracion-3` | Front de la Iteración 3 + `docs/contexto-claude/` |
| `gabo0130/conecta-u` | `feature/tesis-dsr` | Igual a `feature/iteracion-3`; **aquí se trabaja el front de la tesis** |

Verificado: back 793 pruebas unitarias + 67 e2e (Postgres 16 + pgvector local, `AI_PROVIDER=fake`), front 167 pruebas, `tsc` y lint en verde, y recorrido en navegador. Las capturas de los flujos están en el PC de Jhony (`Seminario III\Conecta U - Entrega 4 (Iteracion 3 - avance nube 02-11)`).

Para las pruebas e2e en la nube sin Docker: instalar `postgresql-16-pgvector`, levantar Postgres en el puerto 5433 con usuario/clave `test` y base `conecta_u_test` (`npm run test:e2e`).

### Qué trae `feature/iteracion-3`

- **RF4 / E8 – certificados:** `PUT/GET/DELETE /collaborators/me/experience/:id/certificate` (PDF/PNG/JPG, 2 MB, validado por firma, guardado en la base, solo dueño y ADMIN); `GET /admin/collaborators/:id/experience/:expId/certificate`. Migración `AddExperienceCertificates`. Front: campo obligatorio en el modal de experiencia (laboral, práctica, docencia), insignias y aviso de pendientes.
- **RF17 – personas:** `POST /admin/collaborators`, `PATCH /admin/collaborators/:id/profile`, `PATCH /admin/collaborators/:id/status`. Front: «Registrar persona», «Editar perfil», «Dar de baja / Reactivar».
- **RF15–RF16 – dashboard y reportes:** `GET /admin/stats`, `GET /admin/reports/:kind?format=xlsx|csv` (proyectos, personas, habilidades, recomendaciones, convocatorias). Front: dashboard del ADMIN con barras y tarjeta de reportes.
- **RF21–RF22 – convocatorias:** `POST/GET /projects/:id/invitations` (solo a recomendados, Reply-To del líder, sin repetir en 24 h, historial ENVIADA/FALLIDA, correo enmascarado al líder). Migración `CreateInvitations`. Front: selección en recomendaciones, modal de mensaje e historial.
- Postman actualizado (carpeta «Iteración 3 (Examen)»).

## 1. Seminario – cierre de la Iteración 3 (Examen, sustentación semana 30/11–04/12)

1. Revisar las dos ramas y abrir PR a `develop` (back y front).
2. Desplegar: correr las migraciones nuevas en Neon (las corre Render al desplegar), configurar SMTP en Render (`notes/devops.md` §7), probar humo: certificado, reporte, convocatoria real a un correo propio.
3. Documentos: FP-15 Iteración 3 con las capturas, Acta No. 5 de pruebas con la cliente (RF4, RF15–RF17, RF21–RF22), Project con la planeación de la Iteración 3 (**entrega 27/11 16:00**), FP5, presentación, **certificado de la empresa cliente**.
4. No olvidar: sin la sesión de pruebas con la cliente la iteración no es válida; la Feria de Proyectos de Aula condiciona la tercera nota.

## 2. Tesis – código (rama `feature/tesis-dsr`, extensión compatible; no cambia el alcance del seminario)

Orden sugerido; cada paso con pruebas unitarias y e2e como en la Iteración 3.

| # | Tarea | Detalle técnico | Hecho cuando |
|---|---|---|---|
| T1 | **Necesidad en lenguaje natural** (D1) | Tabla `needs` (descripción, tipo: académica/administrativa/investigativa/tecnológica/bienestar/infraestructura/innovación, estado REGISTRADA→CARACTERIZADA→CONVERTIDA/DESCARTADA, urgencia e impacto 1–5, `characterization` jsonb, `completeness`, `priorityScore`, `projectId`). Rutas `POST/GET /needs`, `GET /needs/:id` (LIDER dueño y ADMIN). | Un formulador registra una necesidad y la ve en su lista |
| T2 | **Caracterización con IA** | Puerto `NeedCharacterizer` con adaptador fake (empareja nombres del catálogo en el texto) y Gemini (prompt JSON: problema, objetivo, beneficiarios, resultados esperados, competencias del catálogo, tipo de proyecto sugerido, información faltante). Mismo patrón que `ProjectAnalyzer` (timeouts, reintentos, cortacircuitos). `POST /needs/:id/characterization`. | Respuesta validada y guardada; 503 si la IA falla |
| T3 | **Índice de completitud** (variable «caracterización de necesidades») | Función pura en `domain/services/need-completeness.ts`: elementos ponderados (problema, objetivo, beneficiarios, resultados, competencias, plazo/urgencia, dependencia) → 0–100 + lista de faltantes. Pesos documentados para validarlos con expertos. | Specs con casos completos/incompletos |
| T4 | **Priorización básica** (D4) | `priority = 100·(0,4·impacto/5 + 0,4·urgencia/5 + 0,2·completitud/100)` → BAJA/MEDIA/ALTA. Justificar en el informe que la avanzada queda fuera del alcance. | Lista de necesidades ordenable por prioridad |
| T5 | **Necesidad → oportunidad** | `POST /needs/:id/opportunity` recibe el mismo cuerpo que `POST /projects` (el front lo precarga desde la caracterización), crea el proyecto y enlaza `needs.projectId`. | El proyecto creado sigue el flujo normal de análisis y recomendación |
| T6 | **Intereses en el perfil** (D5) | `collaborators.interests text[]` (≤ 10), en DTO de perfil, respuesta, importación opcional y en el texto del embedding. | Cambiar intereses marca el embedding como desactualizado |
| T7 | **Aceptar/rechazar recomendación** (D6, tasa de aceptación) | Tabla `recommendation_feedback` por (perfil, persona) con decisión, motivo, puesto y puntaje en el momento (no se pierde al regenerar). `PUT /projects/:id/recommendations/:recId/feedback`. `GET /admin/evaluation` con tasa de aceptación global y por proyecto. | Front muestra Aceptar/Descartar en cada tarjeta |
| T8 | **Métricas @K** | `domain/services/ranking-metrics.ts` (Precision@K, Recall@K, HitRate@K, NDCG@K con relevancia graduada, cobertura de competencias) con specs de valores conocidos. | Specs en verde |
| T9 | **Evaluación offline con datos sintéticos** | Ya existe `scripts/synthetic/` (14 arquetipos, 150 personas, 20 necesidades con pertinencia esperada, `seed-synthetic.ts`). Falta `evaluate-recommender.ts`: corre `computeMatch` contra cada perfil de cada necesidad, compara con línea base (aleatoria y solo habilidades) y escribe `resultados-evaluacion-sintetica.json` + `.md` con K = 5 y 10. | Tabla de resultados reproducible con la misma semilla |
| T10 | **Front de tesis** | `/necesidades` (lista con prioridad y completitud), `/necesidades/nueva`, detalle con caracterización y faltantes, botón «Convertir en oportunidad» que abre el formulario de proyecto precargado; campo Intereses en Mi perfil; botones Aceptar/Descartar en recomendaciones; tarjeta de evaluación en el dashboard del ADMIN. | Recorrido completo en navegador |

## 3. Tesis – documentos (carpeta `Trabajo de Grado - Conecta U`)

| Fase DSR | Documento | Nota |
|---|---|---|
| 1 | Entrevista estructurada final (Anexo A ajustado), consentimiento informado, matriz de revisión documental, matriz de variables y de trazabilidad Categoría → Variable → Indicador → Pregunta → Fuente → Requisito | Los RF del seminario entran como «requisitos derivados» citando su origen |
| 1–4 | Formato de juicio de expertos (3 expertos: claridad, pertinencia, coherencia, suficiencia) para entrevista y rúbrica | |
| 2 | Documento de diseño del modelo de recomendación: puntaje híbrido (habilidades 0,5 · semántica 0,2 · experiencia 0,15 · disponibilidad 0,15), embeddings y coseno reescalado, fórmula del % de correspondencia, completitud y priorización | Ya implementado en `match-score.ts`; solo documentar |
| 4 | Rúbrica de pertinencia de perfiles, cuestionario SUS en español con hoja de cálculo de puntaje, protocolo del piloto (muestra intencional, tareas, tiempos) | |
| 4 | Informe preliminar de evaluación con datos sintéticos | **Marcado como simulación**: no reemplaza el piloto ni la valoración de expertos |
| 5 | Borrador del informe final: capítulos de problema, marco, metodología DSR, diseño, implementación (reutiliza FP-15 de las 3 iteraciones) | Resultados del piloto se escriben solo cuando ocurra |

## 4. Decisiones pendientes tuyas

1. ¿Las funciones de tesis (necesidades, aceptación) se muestran a la cliente como parte del producto del seminario (con control de cambios) o quedan solo en la rama de tesis?
2. ¿Qué hará Walter? Sugerencia: instrumentos de la Fase 1 y aplicación de entrevistas.
3. Valor de K para las métricas (sugerido 5 y 10) y quiénes serán los 3 expertos.
4. Si la sesión con la cliente de la Iteración 2 (03–04/11) sigue en pie: esa va antes que todo lo de este plan.

## 5. Cómo arrancar en el otro chat
Ver el prompt que Jhony pega al iniciar. Commits pequeños por tarea en `feature/tesis-dsr` de cada repo, `tsc` + lint + pruebas en verde antes de cada commit, y actualizar `docs/contexto-claude/notes/estado-desarrollo.md` al cerrar cada tarea.
