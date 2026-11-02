# Plan de cierre — Iteración 2 (análisis con IA y matchmaking)

_Creado el 16/10/2026. Línea base 1: 16/10 → 06/11/2026. Fuente: contrato `backend-iteracion-2.md` §12 y `estado-desarrollo.md`._

## Punto de partida (16/10)

| Pieza | Estado |
|---|---|
| Backend RF8–RF13 (análisis, perfiles manuales, embeddings, recomendaciones) | ✅ `tsc`, `eslint` y 579 tests en verde; migración aplicada en Neon |
| Front RF8–RF10 (análisis, perfiles, historial) | ✅ 86 tests en verde, verificado en navegador |
| Front RF11–RF13 (recomendaciones) | ⏳ `/proyectos/[id]/recomendaciones` es un "Próximamente" |
| Despliegue (Render + base de producción) | ⏳ sin hacer |
| Commits | ⏳ todo sin commitear en ambos repos |

Hitos fijos: **29/10** sesión 1 con la cliente (RF8–RF10) · **03/11** despliegue · **04/11** sesión 2 (RF11–RF13) · **05/11** repruebas y Acta No. 4.

## Fase 1 — Endurecer el backend (16–20/10) · sesión backend · 0,5–1 día

Va primero porque son fallos que la cliente puede ver en la demo.

- [ ] **Análisis `PENDIENTE` colgado:** al arrancar la app, marcar como `ERROR` los análisis `PENDIENTE` anteriores a la ventana de 4 min (hoy un reinicio a mitad de un análisis bloquea el proyecto). Prueba unitaria + prueba reiniciando en vivo.
- [ ] **`errorMessage` propio:** guardar un mensaje en español ("El servicio de IA no respondió", "La respuesta de la IA no tenía el formato esperado") y dejar el detalle técnico solo en el log, no la respuesta cruda de Gemini.
- [ ] **Brechas de auditoría** _(requiere decisión del usuario)_: que lleguen todos los mensajes de validación (hoy solo el primero) y rechazar nombres de entregable duplicados. Si se aprueba, ajustar `HttpExceptionFilter`, el front de formularios y las pruebas.
- **Hecho cuando:** tests en verde, lint y `tsc` limpios, contrato §12 actualizado si cambia algún mensaje.

## Fase 2 — Frontend de recomendaciones (19–24/10) · sesión frontend · 3–4 días

Se arranca en paralelo con la Fase 1 (no depende de ella). Se entrega con un prompt a la sesión del front, basado en el §12.

1. **Cliente y datos:** tipos de recomendaciones (lista, detalle, `breakdown`), hooks `useRecommendations` (cargar, generar, detalle). `POST …/recommendations` reutiliza `AI_REQUEST_CONFIG` (timeout 60 s y sin aviso de "servidor despertando").
2. **Pantalla `/proyectos/[id]/recomendaciones`:** selector de perfil, botón "Generar recomendaciones" (estado de carga, `409` sin análisis), lista ordenada con barra de puntaje, disponibilidad, tipo de persona, programa y marca "sin cuenta"; filtro "incluir no disponibles" (recuerda que solo muestra a quienes entraron en la generación con ese flag); `generatedAt` visible y aviso "regenera tras editar perfiles".
3. **Modal "¿Por qué?" (RF13):** habilidades que coinciden (requerido vs. tiene, meses), faltantes, experiencia relevante, disponibilidad, afinidad semántica y pesos aplicados. Sin correo ni teléfono en ningún lado.
4. **Integración:** botón "Ver recomendaciones" en el detalle del proyecto (ANALIZADO); `AdminProjectInfo` deja de decir "pendiente Iteración 2" y muestra las personas recomendadas en solo lectura; enlaces del menú y del dashboard.
5. **Calidad:** pruebas de hooks y componentes, `tsc`, `lint`, `build`, accesibilidad básica del modal, verificación en navegador con `fake` y una pasada con Gemini real. Actualizar `estado-desarrollo.md`.
- **Opcional:** botón del ADMIN para reconstruir embeddings (`POST /admin/embeddings/rebuild`).
- **Hecho cuando:** un líder analiza un proyecto, genera recomendaciones y abre el "¿Por qué?" de una persona de punta a punta, sin errores en consola.

## Fase 3 — Datos de demostración y limpieza (21–24/10) · backend + usuario · 0,5 día

- [ ] **Limpiar datos de prueba en Neon** _(pedir confirmación antes de borrar)_: `prueba.bug.colaborador@example.com`, entradas "PRB"/PRUEBA_RF22 del catálogo, los 2 colaboradores de la importación de prueba, análisis `fake`/`ERROR`/`PENDIENTE` de SISGELAB y "Test", perfil manual descartado.
- [ ] **Dos proyectos de demo** con análisis real de Gemini y recomendaciones ya generadas (para no depender de la IA en vivo si falla): conservar los dos ya analizados y generar sus recomendaciones.
- [ ] **Guion de la demo** (1 página): cuentas, proyectos, qué mostrar en cada sesión y qué hacer si Gemini falla (`AI_PROVIDER=fake` como respaldo).
- **Hecho cuando:** el seed + el guion reproducen la demo desde cero en una base limpia.

## Fase 4 — Calidad y calibración (26–30/10) · ambas sesiones · 2 días

- [ ] **Calibrar pesos** (`MATCH_WEIGHTS` 0,5/0,2/0,15/0,15) con el dataset de 60+ personas: revisar si las recomendaciones de 3–4 proyectos "se sienten" correctas con el líder; ajustar y registrar la decisión en el FP-15.
- [x] **Pruebas de integración de los endpoints** (17/10, `npm run test:e2e`) con `AI_PROVIDER=fake` (403/409/422/503), como pide el §9 del contrato; hoy solo hay pruebas unitarias y manuales.
- [~] **Revisiones:** revisión de privacidad (Ley 1581) hecha el 17/10, con 3 brechas corregidas (ver `estado-desarrollo.md`). Falta la revisión de código del diff del backend (en línea; el usuario no usa `clean-code-reviewer`).
- [ ] Revisar el costo/tokens de los análisis registrados y la política de cuota diaria.
- **Hecho cuando:** suites en verde en ambos repos y los hallazgos críticos/altos de las revisiones, resueltos.

## Fase 5 — Despliegue (hasta el 28/10 para la sesión 1; final el 03/11) · usuario + backend · 0,5–1 día

_Recomendación: desplegar antes del 29/10 si la sesión con la cliente será sobre el ambiente publicado; si se hará en local, dejarlo para el 03/11._

1. **Render (backend):** variables `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GEMINI_EMBEDDING_MODEL`, `EMBEDDING_DIM`, `AI_TIMEOUT_MS`, `MATCH_WEIGHTS`, `MATCH_TOP_N`, y las que ya existían (SMTP, `APP_URL`, `JWT_SECRET`…).
2. **Base de producción:** habilitar la extensión `vector` (desde el panel de Neon si la migración no puede), correr `migration:run` (migraciones 4 a 7) y `seed` (catálogo de 87 habilidades).
3. **Embeddings:** `POST /admin/embeddings/rebuild` con `force:true` hasta que `remaining` sea 0.
4. **Front (Vercel u hosting actual):** `NEXT_PUBLIC_API_URL` apuntando al backend publicado.
5. **Humo en producción:** login, analizar un proyecto, generar recomendaciones, abrir "¿Por qué?". Comprobar que el "despertar" de Render no se confunda con un fallo de la IA (la primera petición tras dormir puede tardar; tenerlo presente en la demo).
- **Hecho cuando:** el recorrido completo funciona en el ambiente publicado.

## Fase 6 — Sesiones de aceptación y cierre (29/10 → 06/11)

| Fecha | Qué | Preparación |
|---|---|---|
| 29/10 | Sesión 1: RF8–RF10 con la cliente | Fases 1–3 listas; guion de demo; respaldo `fake` probado |
| 03/11 | Despliegue final | Fase 5 completa |
| 04/11 | Sesión 2: RF11–RF13 | Fase 2 + calibración (Fase 4) |
| 05/11 | Repruebas y Acta No. 4 | Lista de hallazgos de las dos sesiones |
| 06/11 | Cierre de la línea base | Commits/PRs, `git add --renormalize .`, notas y Postman al día |

## Decisiones pendientes del usuario

1. ¿Se arreglan las dos brechas de la auditoría (Fase 1)?
2. ¿La sesión del 29/10 será en local o en el ambiente desplegado? (define si la Fase 5 se adelanta)
3. ¿Se puede limpiar los datos de prueba de Neon (Fase 3)?
4. Estrategia de commits: rama por repo y PRs, o commits directos; nada se commitea hasta que se pida.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Gemini saturado o modelo retirado (ya pasó con `gemini-2.5-flash`) | modelo de respaldo, reintentos, `fake` como plan B, fijar el modelo por variable y revisarlo antes de cada sesión |
| Análisis lento (hasta 45 s) frente al timeout del navegador | 60 s en el front, consulta del análisis tras un corte, datos de demo ya generados |
| pgvector no disponible en producción | habilitar la extensión desde el panel antes del despliegue; sin embeddings el puntaje sigue funcionando (reparte el peso) |
| Pesos que dan recomendaciones poco creíbles | calibración con el líder en la Fase 4 y pesos por variable de entorno, sin tocar código |
| Mucho trabajo sin commitear | commitear por bloques al cerrar cada fase (cuando el usuario lo apruebe) |
