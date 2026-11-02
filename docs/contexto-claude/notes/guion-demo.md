# Guion de demo — Iteración 2 (RF8–RF13)

_17/10/2026. Para las sesiones con la cliente del 29/10 (RF8–RF10) y 04/11 (RF11–RF13). Una página._

## Antes de empezar (30 min antes)

1. Backend arriba (`npm run start:dev` en local o el servicio de Render despierto: abrir `/api/health` hasta que responda; en Render el primer arranque tarda hasta 5 min y **no** es un fallo de la IA).
2. Revisar que Gemini responde: `AI_PROVIDER=gemini`, modelo `gemini-3.8-flash` (respaldo `gemini-3.5-flash-lite`). Si un modelo da 404, listar los modelos con la llave y fijar otro por variable de entorno.
3. Front en `http://localhost:3000` (o el publicado). Iniciar sesión una vez para calentar.

## Cuentas (solo desarrollo, contraseña del seed)

| Rol | Cuenta | Para qué |
|---|---|---|
| LIDER | `laura.mendez@conectau.test` | Todo el recorrido |
| ADMIN | `admin@conectau.test` | Vista de solo lectura y catálogos |

## Proyectos de Laura

| Proyecto | Estado | Uso en la demo |
|---|---|---|
| Reducción de desperdicio de alimentos (IoT) | ANALIZADO (Gemini) + 16 recomendaciones | Proyecto principal: ya listo, no depende de la IA en vivo |
| Gestión de visitas empresariales | ANALIZADO (Gemini) + 29 recomendaciones | Segundo proyecto listo; "Volver a generar" en vivo si se quiere mostrar (1–20 s) |
| SISGELAB — Sistema de gestión de laboratorios | BORRADOR, sin análisis | Analizar con IA en vivo (15–45 s) y mostrar "Primero hay que analizar" en recomendaciones |

## Sesión 1 (29/10) — RF8–RF10

1. Laura → Proyectos → SISGELAB → "Analizar con IA". Explicar mientras corre: la IA lee título, resumen, objetivos, habilidades y entregables.
2. Mostrar perfiles (técnicos y blandas), **justificación** (RF10), habilidades "no catalogadas" en gris.
3. Editar un perfil, agregar uno manual, descartar otro (RF9). Historial de análisis a la derecha.
4. Editar el proyecto → aviso "El proyecto cambió desde el último análisis".
5. ADMIN → mismo proyecto en solo lectura.

## Sesión 2 (04/11) — RF11–RF13

1. Laura → IoT → "Ver recomendaciones": píldoras por perfil, puntaje, disponibilidad, "Sin cuenta".
2. "¿Por qué?" de la primera persona (RF13): aporte de cada criterio con su peso, habilidades que coinciden y faltan, experiencia, disponibilidad, afinidad semántica.
3. "Incluir no disponibles" y explicar que solo aparecen si la generación también los incluyó.
4. Gestión de visitas → recomendaciones de otro tipo de proyecto; opcional "Volver a generar" en vivo.
5. ADMIN → detalle del proyecto → "Personas recomendadas" (solo lectura, sin botón de generar).

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| 503 "El servicio de análisis no está disponible" | "Reintentar" una vez; si sigue, pasar al proyecto IoT ya analizado |
| 503 "alcanzó su límite de uso por hoy" | Cuota de Gemini agotada: usar IoT y Gestión de visitas (ya analizados) |
| 409 "máximo de análisis por día" | Límite de 5 intentos por proyecto y día: usar otro proyecto |
| Gemini caído del todo | Reiniciar el backend con `AI_PROVIDER=fake` (config `conecta-u-back-fake-ai`): análisis instantáneo con 2 perfiles fijos. **No generar recomendaciones con `fake`** sobre la base compartida: reescribe los embeddings con el modelo falso (se corrige con `POST /admin/embeddings/rebuild` `{force:true}` con Gemini) |
| Pantalla "Estamos levantando el servidor" | Render despertando: esperar; no es la IA |
