# Ajustes v2.2 — sustentación del Corte Dos (revisión de la docente)

Fuente: sustentación del Corte Dos ante la Ing. María del Pilar Rojas Puentes (docente evaluadora). Formalizado en `Planificación Alcance Global v2.2` y `Acta de aprobación de RF v2.2` (carpeta `Conecta U - Entrega 3 (Iteracion 2)/00 Control de cambios v2.2`). Firma de la cliente pendiente (sesión 1).

**Es obligatorio desde el 01/11/2026 en todo desarrollo y documento nuevo.** Complementa a `ajustes-cliente-v2.1.md`, que sigue vigente.

## 1. Renumeración de HU y RF (v2.1 → v2.2)

La docente pidió quitar RF redundantes y que cada RF diga el **actor** y las **operaciones** (crear, consultar, actualizar, eliminar). Ninguna funcionalidad se elimina; solo se fusionan y se renumeran.

| RF v2.1 | RF v2.2 | Nota |
|---|---|---|
| RF1–RF3 | RF1–RF3 | RF3 ahora incluye el antiguo RF4 |
| RF4 | **RF3** | fusionado: conocimientos y competencias son parte del perfil técnico |
| RF5 | RF4 | experiencia (+ certificado en la Iteración 3) |
| RF6 | RF5 | disponibilidad |
| RF7, RF8, RF9, RF10 | **RF6** | registro del proyecto (campos, clasificación y entregables) |
| RF11 | RF7 | consultar y actualizar proyecto (incluye editar entregables) |
| RF12–RF17 | RF8–RF13 | análisis IA, perfiles, justificación, comparación, lista, «¿Por qué?» |
| RF18 | RF14 | gestionar cuentas (activar / **inhabilitar** acceso) |
| RF19–RF20 | RF15–RF16 | dashboard y reportes |
| RF21 | RF17 | gestionar personas |
| RF22 | RF18 | gestionar catálogos y plantillas |
| RF23–RF24 | RF19–RF20 | importación desde Excel |
| RF25–RF26 | RF21–RF22 | convocatoria por correo |

HU: HU-04 → HU-03 (fusionada); HU-05…HU-19 → HU-04…HU-18. La regla está en `C:\Users\yoonn\Claude outputs\renum.py` (`remap()`), que se aplica **una sola vez** a cada texto (aplicarla dos veces corre los números de nuevo).

## 2. Cambios de producto

| # | Cambio | RF v2.2 | Iteración |
|---|---|---|---|
| E2 | **Declaración de veracidad (buena fe, art. 83 C.P.)**: casilla obligatoria en el registro y al editar «Mi perfil»: «Declaro que la información registrada es verídica y que presentaré los soportes cuando se me soliciten». Se guarda `truthfulnessDeclared` + `truthfulnessDeclaredAt` (como `dataConsent`). Los textos de la autorización de datos y de la declaración se pueden **ver** (páginas públicas). | RF1, RF3 | 2 |
| E3 | La notificación de registro llega también al **correo alterno** cuando exista. | RF1 | 2 |
| E4 | **Aviso en recomendaciones**: «Recomendación basada en la información declarada por cada persona; sujeta a verificación de su experiencia y conocimientos.» En la lista y en el panel «¿Por qué?». | RF12 | 2 |
| E5 | Proyecto: **entidad ejecutora**, **entidad patrocinadora** y **duración (meses)**. «Habilidades técnicas y blandas conocidas» pasa a **«Competencias técnicas y blandas requeridas por el proyecto»** (solo etiquetas; el campo interno sigue siendo `knownSkills`). | RF6, RF7 | 2 |
| E6 | **Clasificación**: `CONOCIMIENTO` = «Conocimiento técnico» (herramientas, tecnologías), `COMPETENCIA` = «Competencia técnica» (rol o disciplina: investigador, desarrollador…), `HABILIDAD_BLANDA` = «Competencia blanda». Solo cambian las etiquetas y el prompt de IA (los valores del enum no cambian). Ampliar el catálogo con habilidades de otras carreras de la UFPS. | RF3, RF9, RF18 | 2 |
| E7 | El admin **inhabilita el acceso** de quien deja la UFPS (ya existe: `active=false` impide el login). Solo cambia la etiqueta «Desactivar» → «Inhabilitar acceso». | RF14 | 2 |
| E8 | **Certificado obligatorio** (PDF o imagen) en la experiencia laboral, de práctica y de docencia; almacenamiento de archivos con acceso restringido (RT16). | RF4 | **3** |
| P6 | Correo en producción: configurar SMTP en Render con un remitente verificado (SPF/DKIM) para que no llegue a spam. Lo configura Jhony; sin secretos en el repo. | — | 2 |
| P11 | Guía de importación actualizada con las etiquetas nuevas (los duplicados por documento ya existen desde v2.1). | RF19–RF20 | 2 |

## 3. Reglas que no cambian

- La clave de Gemini solo vive en el backend.
- Solo se recomienda a personas con `dataConsent=true`; las recomendaciones nunca muestran correo, teléfono ni documento.
- La decisión técnica de identificador interno (uuid como PK) **no** va en documentos para la cliente.
- No inventar datos: resultados de pruebas con la cliente solo cuando ocurran.
