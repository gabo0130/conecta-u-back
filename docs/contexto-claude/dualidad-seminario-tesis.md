# Dualidad Conecta U: Seminario Integrador III ↔ Trabajo de Grado (Anteproyecto PGCS01)

> Copia del documento del proyecto de claude.ai (25/10/2026), sin códigos estudiantiles. Fuente tesis: *PGCS01 – Anteproyecto final aceptado* (extracto en `tesis-anteproyecto-extracto.md`). Fuente seminario: Planificación Alcance Global v2.2.
> Regla de oro: **un solo código base**; lo que la tesis exige y el seminario no tiene se agrega como *extensión compatible* (rama `feature/tesis-dsr`), no como cambio de alcance del seminario sin control de cambios.

## 1. Ficha comparada

| Aspecto | Seminario Integrador III | Trabajo de grado (tesis) |
|---|---|---|
| Título | Conecta U — plataforma web inteligente para articular necesidades, capacidades y proyectos | *Conecta U: Sistema web inteligente para la articulación de necesidades, capacidades y proyectos colaborativos en la UFPS* |
| Autores | Jhony Gabriel Quintero Gómez (ejecutor único) | Jhony Gabriel Quintero Gómez y Walter Steven Casadiegos Quintero |
| Rol de la Dra. Judith Rodríguez Tenjo | Cliente | Directora |
| Tipo de trabajo | Proyecto de software (PMV) con HU, RF, iteraciones | Investigación aplicada, enfoque mixto, Design Science Research (Hevner 2004; Peffers 2007) |
| Flujo central | Proyecto → análisis IA → perfiles → matchmaking → recomendación → convocatoria | Necesidad → Caracterización → Oportunidad → Recomendación de perfiles |
| Validación | Pruebas de aceptación con la cliente + actas | Piloto controlado (Ing. de Sistemas) + métricas @K + SUS + rúbrica de 3 expertos |

## 2. Común
Problema (capacidades dispersas), PLN + recomendación híbrida (el sistema sugiere, el usuario decide), mismo stack (Next.js/Vercel, NestJS/Render, PostgreSQL/Neon, IA por API), recomendación de perfiles individuales con justificación.

## 3. Diferencias y cómo manejarlas

| # | Diferencia | Tesis exige | Cómo manejarla |
|---|---|---|---|
| D1 | Punto de partida | Necesidad institucional en lenguaje natural (académica, administrativa, investigativa, tecnológica, bienestar, infraestructura, innovación) que se caracteriza y genera una Oportunidad | Entidad `Necesidad` que puede originar un proyecto (= oportunidad). El seminario no se toca. |
| D2 | Actores | 10 conceptuales; en el piloto: estudiantes, docentes/formuladores, administradores | Formulador ≈ Líder; Docente/Estudiante ≈ Colaborador. Declararlo en la tesis. |
| D3 | Salida | Ranking con % de correspondencia por similitud semántica | Ya existe: `score` 0–100 con embeddings (pgvector). |
| D4 | Priorización | Objetivo dice *caracterización, priorización y recomendación*; alcance excluye solo la avanzada | Priorización básica (urgencia, impacto, completitud). |
| D5 | Perfil | Competencias, **intereses** y experiencia | Campo `interests` en el colaborador. |
| D6 | Evaluación | Precision@K, Recall@K, HitRate@K, NDCG@K, tasa de aceptación, cobertura de competencias, índice de completitud de la necesidad, SUS | Guardar aceptado/rechazado por recomendación; casos con ground truth; script de métricas. |
| D7 | Metodología | DSR en 6 fases | Las iteraciones del seminario caben en la Fase 3. |
| D8 | Instrumentos | Entrevista (Anexo A, 12 preguntas, dimensiones A–J), matriz documental, matriz de trazabilidad, juicio de expertos | RF del seminario = requisitos derivados. |
| D9 | Funciones extra del seminario | Fuera de alcance: comunicación avanzada, gestión integral | En la tesis presentarlas como soporte (Excel = carga del piloto; correo = notificación simple). |
| D10 | Equipo y costo | 2 estudiantes, $29.636.800 | No mezclar cifras entre documentos. |

## 4. Reglas
1. Un repo por capa; lo de la tesis no rompe las HU del seminario (campos opcionales, entidades nuevas).
2. Vocabulario: seminario → proyecto, líder, colaborador, HU/RF. Tesis → necesidad, oportunidad, formulador, perfil, artefacto, fase DSR, variable/indicador.
3. Cambios de alcance del seminario solo con control de cambios firmado por la cliente.
4. Resultados de pruebas o piloto nunca se inventan; lo sintético se marca como simulación.
