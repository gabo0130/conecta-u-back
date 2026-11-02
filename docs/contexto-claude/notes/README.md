# Notas de Conecta U (locales, no versionadas)

Copia de los documentos del proyecto **"Conecta U"** en claude.ai. La misma carpeta `notes/` existe en `conecta-u-back` y en `conecta-u`, con el mismo contenido: si se actualiza una nota, copiarla a los dos repos y al proyecto de claude.ai.

| Archivo | Qué contiene | Cuándo leerlo |
|---|---|---|
| `contexto-desarrollo.md` | Problema, alcance del PMV, HU, RF1–RF22, RNF, RT, iteraciones, costos | Siempre (importado en CLAUDE.md) |
| `backend-iteracion-1.md` | Modelo de datos v2.0, endpoints, DTOs, importación Excel, migración | Siempre (importado); en el front es el contrato de la API |
| `estado-desarrollo.md` | Barrido de lo desarrollado y brechas contra v2.0 | Siempre (importado); actualizar al cerrar cada tarea grande |
| `reglas-frontend.md` | Reglas de código del frontend (estructura, atomic design, datos/API, estilos, responsive, formularios coordinados, buenas prácticas, checklist de cierre) | Importado en el CLAUDE.md del front; en el back solo como referencia |
| `plan-ajuste-clean-code.md` | Plan y checklist de la corrección de los 23 hallazgos de `clean-code-reviewer` (25/09) y convenciones que dejó | Al revisar código o dudar de una convención del back |
| `plan-iteracion-2.md` | Plan de trabajo de la Iteración 2 (Corte Tres, HU-08…HU-12, RF8–RF13): evaluación, decisiones, diseño de IA y matchmaking, cronograma al 06/11 | Al planear o ejecutar la Iteración 2 |
| `ajustes-cliente-v2.1.md` | Ajustes que pidió la cliente el 19/10 (control de cambios v2.1): documento de identidad único, teléfono, nacionalidad, correo alterno, admin registra proyectos, campos de plantilla (palabras clave, valor en pesos); diseño, cambios por capa, pruebas y prompt | **Siempre** desde el 19/10: es requisito de todo desarrollo nuevo |
| `ajustes-docente-v2.2.md` | Ajustes de la sustentación del Corte Dos (control de cambios v2.2): tabla de renumeración RF/HU, declaración de veracidad, correo alterno, aviso de verificación, campos del proyecto, etiquetas de competencias; certificados en la Iteración 3 | **Siempre** desde el 01/11: numeración y requisitos vigentes |
| `backend-iteracion-2.md` | Diseño técnico de la Iteración 2: Gemini, tablas nuevas (análisis, perfiles requeridos, recomendaciones, pgvector), endpoints, puntaje híbrido, pantallas, pruebas | Al construir RF8–RF13; reemplaza las decisiones de diseño del plan donde no coinciden (§11) |
| `todo-iteracion-1.md` | Checklist de la Entrega 2 (código + Documento Ingenieril) | Al planear o cerrar tareas |
| `arquitectura.md` | Diagramas Mermaid (contenedores, capas, módulos, despliegue, secuencia) | Al tocar arquitectura o documentarla |
| `revision-coherencia.md` | Historial de cambios del alcance v2.0 y pendientes documentales | Solo si hay dudas de por qué cambió algo |
| `lineamientos-seminario-iii.md` | Formatos oficiales del curso (HU, RF, actas, pruebas de aceptación, Documento Ingenieril) | Al redactar entregables académicos |
| `guion-demo.md` | Guion de las sesiones con la cliente de la Iteración 2: cuentas, proyectos, recorrido y qué hacer si falla la IA | Antes de cada demo |

Documento técnico completo (claude.ai): https://claude.ai/code/artifact/0647c651-83d4-412e-9014-d997f3c8f453
