# Contexto para Claude (sesiones en la nube)

Esta carpeta existe porque `notes/` y `CLAUDE.md` **no se versionan** (están en el `.gitignore`) y viven solo en el PC de Jhony. Es una copia del 02/11/2026 para que una sesión de Claude Code con acceso al repo tenga el mismo contexto. **La fuente de verdad sigue siendo `notes/` en el PC**: si cambias algo aquí, avísalo para actualizarlo allá.

| Archivo | Para qué |
|---|---|
| `PLAN-iteracion-3-y-tesis.md` | **Empieza aquí.** Qué está hecho, qué falta y en qué orden |
| `CLAUDE-local.md` | El `CLAUDE.md` local del repo (rol, convenciones, reglas de capas). Seguirlo como si fuera el `CLAUDE.md` |
| `notes/contexto-desarrollo.md` | Producto, actores, RF/RNF |
| `notes/backend-iteracion-1.md`, `notes/backend-iteracion-2.md` | Contratos de la API (modelo v2.0; IA y matchmaking §12) |
| `notes/ajustes-cliente-v2.1.md`, `notes/ajustes-docente-v2.2.md` | Controles de cambio obligatorios (numeración RF1–RF22 v2.2) |
| `notes/estado-desarrollo.md` | Bitácora de todo lo implementado y verificado |
| `notes/reglas-frontend.md` | Reglas del front (atomic design, hooks, notify, tablas) |
| `notes/devops.md` | CI, despliegue en Render/Vercel/Neon, SMTP |
| `dualidad-seminario-tesis.md` | Cómo conviven el seminario y la tesis en el mismo código |
| `tesis-anteproyecto-extracto.md` | Objetivos, alcance, metodología DSR, variables, métricas, matriz de trazabilidad y Anexo A del anteproyecto PGCS01 |
| `pendientes-seminario.md` | Calendario de entregas y pendientes del Corte Tres / Examen |

Reglas que no cambian: nada de secretos en el repo; no tocar Neon/Render ni `develop`/`master` sin que Jhony lo pida; no inventar resultados de pruebas con la cliente ni del piloto.
