# Contexto de Desarrollo — Conecta U (UFPS Conecta)

> Información real y completa del proyecto, extraída de **Planificación Alcance Global v2.0** (25/09/2026). Documento base para alinear todos los entregables de Seminario Integrador III (Ing. de Sistemas, UFPS).
> **v2.0 reemplaza a la v1.0 (09/09/2026).** Cambios principales al final del documento.
> **Desde v2.2 (01/11/2026) se usa la numeración nueva de RF y HU** (tabla en `notes/ajustes-docente-v2.2.md` §1). Este documento ya está renumerado.

## Ficha del proyecto
- **Nombre:** Conecta U (UFPS Conecta)
- **Identificación:** UFPS-CON-001
- **Versión:** 2.0 · **Fecha de emisión:** 25/09/2026 · Soportes: Acta de Reunión No. 2 y Acta de Aprobación de RF v2.0 (por firmar)
- **Cliente / Directora:** Dra. Judith del Pilar Rodríguez Tenjo
- **Ejecutor:** Estudiante desarrollador (Jhony Gabriel Quintero Gómez)

---

## 1. Contexto del problema

La UFPS desarrolla proyectos de distinta naturaleza —de investigación (grupos y semilleros), de curso, interdisciplinarios y de extensión— que requieren estudiantes y docentes con diferentes conocimientos, competencias, habilidades blandas y experiencias. Sus líderes necesitan identificar y articular personas con los perfiles y capacidades necesarias, pero esa información está distribuida entre distintas personas y espacios. Conecta U apoya este proceso analizando la información de los proyectos y recomendando personas con perfiles compatibles.

## 2. Objetivo y alcance del PMV

- **Tipos de proyecto:** investigación/semillero, curso, interdisciplinario y extensión. No todos piden la misma información → **la plantilla de registro se adapta al tipo**. Cada proyecto tiene **categoría** y **entregables con breve alcance (producto)**. Quedan fuera proyectos informales o personales sin vínculo académico.
- **Persona ≠ Usuario:** una *persona* es un estudiante o docente con perfil (conocimientos, competencias, habilidades blandas, experiencia, disponibilidad) que puede ser recomendado; un *usuario* es una cuenta de acceso. **Una persona no necesita usuario**: puede ser creada por el administrador o importada desde Excel y aun así entra al matchmaking y puede ser convocada por correo.
- **Dashboard del administrador:** indicadores, estadísticas y reportes + gestión de usuarios, personas y catálogos + importación desde Excel (sirve también para poblar con datos de prueba ficticios).
- **Convocatoria por correo:** el líder envía correos a las personas recomendadas mediante un **servidor SMTP en host local**.

**Flujo principal:** Proyecto (según tipo y categoría) → carga estructurada → análisis IA → perfiles requeridos (técnicos y habilidades blandas) → justificación → matchmaking con personas → recomendación → convocatoria por correo.

Todo es administrable: el sistema sugiere, el líder decide.

## 2.1 Perfil técnico del colaborador y plantilla de carga

Modelo: `Collaborator` con id propio y `userId` opcional (colaborador ≠ usuario; un líder también puede tener perfil técnico). Habilidades desde el catálogo `skills` (con sinónimos); programas desde el catálogo `programs`. Solo se pide lo que usa el sistema (matchmaking, convocatoria, dashboard).

Archivo **Plantilla Carga Colaboradores – Conecta U.xlsx** (HU-17, Iteración 1; ~11 KB, sin fórmulas). La columna `correo` une las hojas.

| Hoja | Campos (* obligatorio) |
|---|---|
| Colaboradores | correo*, nombres*, apellidos*, tipo_persona*, programa*, semestre, semillero_o_grupo, resumen, enlace, disponibilidad*, horas_semana*, autoriza_datos* |
| Habilidades | correo*, habilidad* (nombre o sinónimo del catálogo), tipo*, categoría, **nivel***, **meses_experiencia***, ultimo_uso |
| Experiencia | correo*, tipo*, rol*, organización*, fecha_inicio*, fecha_fin, actual*, **horas_semana***, **nivel***, tecnologías, descripción |

**Niveles:** Básico · Intermedio · Avanzado · Experto. **Fuera del PMV:** formación, certificaciones, idiomas, teléfono, ciudad, días y franja.

## 3. Stakeholders

| Stakeholder | Rol en el proyecto | Interés / participación |
|---|---|---|
| Dra. Judith del Pilar Rodríguez Tenjo | Cliente / directora | Orientar y validar el alcance funcional y los entregables. |
| Estudiante desarrollador | Ejecutor | Análisis, diseño, desarrollo, integración de IA, pruebas, documentación y gestión. |
| Líder de Proyecto | Docente / investigador / líder de proyecto | Registrar proyectos de cualquier tipo, solicitar perfiles, consultar recomendaciones y enviar convocatorias. |
| Colaborador | Estudiante / docente | Mantener su información (conocimientos, competencias, habilidades blandas, experiencia, disponibilidad). |
| Administrador | Administrador de la plataforma | Gestionar usuarios, personas, catálogos, importar Excel y consultar el dashboard. |

## 4. Actores del sistema (3 actores)

- **Líder de Proyecto:** registra un proyecto con la plantilla de su tipo, solicita el análisis de IA, consulta perfiles requeridos, revisa personas recomendadas y les envía convocatorias por correo.
- **Administrador:** administra la plataforma desde un dashboard (usuarios, personas, semilleros, programas, tipos y categorías de proyecto, importación Excel, indicadores y reportes).
- **Colaborador:** estudiante o docente **con usuario**, vinculado a una persona, que mantiene su perfil. Las personas sin usuario no son actores, pero sí se usan en la recomendación.

## 5. Historias de Usuario (19)

| HU | Nombre | Rol | Valor | Costo | Riesgo | Prioriz. (1/3/5) | Iter. |
|---|---|---|---|---|---|---|---|
| HU-01 | Registrar usuario (vincula/crea persona si es colaborador) | Líder / Colaborador | Alto | Bajo | Alto | 1 (Baja) | 1 |
| HU-02 | Iniciar sesión | Líder / Colaborador / Admin | Alto | Bajo | Medio | 3 (Media)* | 1 |
| HU-03 | Gestionar perfil técnico | Colaborador | Alto | Medio | Medio | 5 (Alta) | 1 |
| HU-03 | Registrar conocimientos, competencias y habilidades blandas | Colaborador | Alto | Medio | Medio | 5 (Alta) | 1 |
| HU-04 | Registrar experiencia | Colaborador | Medio | Medio | Bajo | 3 (Media)* | 1 |
| HU-05 | Registrar disponibilidad | Colaborador | Alto | Medio | Medio | 5 (Alta) | 1 |
| HU-06 | Registrar proyecto (por tipo, con categoría y entregables) | Líder | Alto | Medio | Medio | 5 (Alta) | 1 |
| HU-07 | Consultar y actualizar proyecto | Líder | Alto | Medio | Bajo | 3 (Media)* | 1 |
| HU-08 | Analizar proyecto mediante IA | Líder | Alto | Alto | Alto | 5 (Alta)* | 2 |
| HU-09 | Identificar perfiles requeridos (técnicos y blandas) | Líder | Alto | Alto | Alto | 5 (Alta)* | 2 |
| HU-10 | Consultar justificación de perfil | Líder | Alto | Medio | Alto | 3 (Media)* | 2 |
| HU-11 | Recomendar colaboradores (personas con o sin usuario) | Líder | Alto | Alto | Alto | 5 (Alta)* | 2 |
| HU-12 | Consultar justificación de recomendación | Líder | Alto | Alto | Alto | 5 (Alta)* | 2 |
| HU-13 | Gestionar usuarios | Administrador | Medio | Medio | Medio | 3 (Media) | 3 |
| HU-14 | Consultar dashboard, estadísticas y reportes | Administrador | Alto | Medio | Medio | 5 (Alta) | 3 |
| HU-15 | Gestionar personas | Administrador | Alto | Medio | Medio | 5 (Alta) | 3 |
| HU-16 | Gestionar catálogos (semilleros, programas, tipos, categorías) | Administrador | Medio | Bajo | Bajo | 3 (Media)* | 3 |
| HU-17 | Importar colaboradores desde Excel (perfil técnico) | Administrador | Alto | Medio | Medio | 5 (Alta) | 1 |
| HU-18 | Enviar convocatoria por correo | Líder | Alto | Medio | Medio | 5 (Alta) | 3 |

> Priorización según la tabla ponderada de los lineamientos (1 baja, 3 media, 5 alta). **\*** = la combinación Valor/Costo/Riesgo no está en la tabla; se conserva el criterio del equipo y conviene confirmarlo con la docente.

## 6. Requerimientos Funcionales (RF1–RF22, numeración consecutiva)

En la v2.0 los RF se renumeraron en orden de HU (lineamiento: ID consecutivo). Equivalencias con la v1.0: RF6→RF7, RF6→RF8, RF7→RF9, RF8→RF10, RF9→RF11, RF10→RF12, RF11→RF13, RF12→RF14, RF13→RF15, RF14→RF16.

- **HU-01 → RF1:** Registrar usuarios, asignar rol y, si es colaborador, vincular la cuenta con una persona.
- **HU-02 → RF2:** Iniciar sesión mediante credenciales.
- **HU-03 → RF3:** El colaborador consulta y actualiza su perfil técnico (datos básicos, programa, semillero o grupo, resumen y enlace).
- **HU-03 → RF3:** Registrar, consultar, actualizar y eliminar conocimientos, competencias y habilidades blandas con categoría, **nivel (Básico/Intermedio/Avanzado/Experto)**, tiempo de experiencia (meses) y último uso.
- **HU-04 → RF4:** Registrar, actualizar y eliminar experiencia con tipo, rol, fechas, **dedicación (h/semana)**, **nivel de desempeño** y tecnologías usadas.
- **HU-05 → RF5:** Registrar y actualizar disponibilidad (estado y horas por semana).
- **HU-06 → RF6:** Registrar proyecto con plantilla que se adapta al tipo. **RF6:** Título, resumen, objetivos, habilidades técnicas y blandas conocidas y campos del tipo. **RF6:** Clasificar por tipo y categoría. **RF6:** Registrar entregables con breve alcance (producto).
- **HU-07 → RF7:** Consultar y actualizar proyectos.
- **HU-08 → RF8:** Solicitar análisis mediante IA.
- **HU-09 → RF9:** Presentar perfiles requeridos (técnicos y habilidades blandas).
- **HU-10 → RF10:** Justificación por perfil.
- **HU-11 → RF11:** Comparar perfiles requeridos con personas registradas (con o sin usuario). **RF12:** Lista de personas recomendadas.
- **HU-12 → RF13:** Elementos del perfil de la persona que sustentan la recomendación.
- **HU-13 → RF14:** Gestionar cuentas de usuario (crear, consultar, actualizar, activar/desactivar, asignar rol, vincular con persona).
- **HU-14 → RF15:** Dashboard con indicadores y estadísticas (proyectos por tipo/categoría, perfiles, personas, disponibilidad) y acceso a gestión. **RF16:** Reportes consolidados.
- **HU-15 → RF17:** Crear, consultar, actualizar y dar de baja personas sin requerir usuario.
- **HU-16 → RF18:** Gestionar semilleros, programas, tipos y categorías de proyecto.
- **HU-17 → RF19:** Importar colaboradores (perfil técnico) desde la plantilla Excel. **RF20:** Validar, registrar válidos e informar rechazados (hoja, fila, causa).
- **HU-18 → RF21:** Enviar convocatorias por correo vía SMTP en host local. **RF22:** Historial de convocatorias por proyecto (fecha, destinatario, estado).

## 7. Requerimientos No Funcionales (RNF)

1. **Usabilidad** — navegación clara y consistente para los tres actores.
2. **Compatibilidad** — navegadores modernos y distintos tamaños de pantalla.
3. **Rendimiento** — tiempos adecuados, sin bloqueos perceptibles.
4. **Seguridad** — proteger credenciales y restringir acceso por rol.
5. **Privacidad** — datos de personas (perfil, disponibilidad, contacto) visibles solo según reglas de acceso; los datos de prueba deben ser ficticios.
6. **Disponibilidad** — manejo controlado de fallos de servicios externos.
7. **Mantenibilidad** — código modular y documentado.
8. **Trazabilidad** — recomendaciones y perfiles explican su origen y criterios.
9. **Integridad de datos** — la importación Excel valida formato, obligatorios y duplicados (correo) sin dejar cargas parciales inconsistentes.
10. **Confiabilidad de notificaciones** — una falla del servidor de correo no bloquea la plataforma; se registra el estado de cada envío.

## 8. Requerimientos Técnicos

- **RT1** — Aplicación web por navegador e Internet.
- **RT2** — Frontend React y/o Next.js, responsive.
- **RT3** — Backend Node.js + NestJS (API).
- **RT4** — PostgreSQL: usuarios, roles, **personas (entidad independiente del usuario)**, conocimientos, competencias, habilidades blandas, experiencia, disponibilidad, proyectos (tipo, categoría, entregables), semilleros, programas, convocatorias y resultados de recomendación.
- **RT5** — IA por API (Gemini u OpenAI).
- **RT6** — Matchmaking contra los atributos de las **personas**.
- **RT7** — IA con límites de consumo, costos y manejo de errores.
- **RT8** — Secretos en variables de entorno.
- **RT9** — Despliegue cloud gestionado (Vercel; Render/Railway).
- **RT10** — HTTPS.
- **RT11** — Evaluar pgvector antes de una segunda BD.
- **RT12** — Justificación técnica y económica de herramientas.
- **RT13** — Importación .xlsx en backend con ExcelJS o SheetJS y plantilla definida.
- **RT14** — Correo con servidor SMTP propio en host local (Postfix; Mailpit en desarrollo) + Nodemailer; parámetros en variables de entorno; el backend debe tener acceso de red al servidor.
- **RT15** — Dashboard con librería de gráficos (Recharts o Chart.js) sobre endpoints de estadísticas agregadas.

## 9. Plan de iteraciones

**Iteración 1 — Corte Dos · Base funcional** (HU-01 a HU-07, HU-17 · RF1–RF7, RF19–RF20) · entrega **09/10/2026**
Registro/autenticación, **modelo Persona independiente de Usuario**, **perfil técnico del colaborador** (habilidades del catálogo con nivel y meses, experiencia con dedicación y nivel, disponibilidad), catálogos de habilidades y programas, **importación de colaboradores desde Excel** y proyectos por tipo con categoría y entregables. *Sin IA ni matchmaking. Tipos y categorías como valores iniciales (seed); su administración va en la Iteración 3.*

**Iteración 2 — Corte Tres · PMV con innovación** (HU-08 a HU-12 · RF8–RF13) · entrega **06/11/2026**
IA, perfiles requeridos, justificación, matchmaking (considera nivel y tiempo de experiencia) y recomendación; se valida con las hojas de vida cargadas desde Excel en la Iteración 1.

**Iteración 3 — Examen · Consolidación y administración** (HU-13 a HU-16, HU-18 · RF14–RF18, RF21–RF22) · entrega final **27/11/2026**
Dashboard del administrador con gestión de usuarios, personas y catálogos, estadísticas/reportes y **convocatoria por correo (SMTP local)**.

Cada iteración cierra con **pruebas de aceptación con la cliente + Acta de Reunión** (tarea explícita en EDT y cronograma).

## 10. EDT del proyecto (v2.0 — imagen actualizada en el documento)

**1. Conecta U**
- **1.1 Gestión del proyecto:** 1.1.1 Planificación y alcance · 1.1.2 Ajuste de HU y RF · 1.1.3 Gestión documental, actas y evidencias.
- **1.2 Análisis y levantamiento:** 1.2.1 Caracterización del problema · 1.2.2 Identificación y validación de actores · 1.2.3 Refinamiento de HU y RF.
- **1.3 Diseño:** 1.3.1 Arquitectura de software · 1.3.2 Modelo de datos (Persona / Usuario) · 1.3.3 Diseño de interfaces · 1.3.4 Diseño del mecanismo de recomendación.
- **1.4 Desarrollo – Iteración 1:** 1.4.1 Usuarios y autenticación (3 d) · 1.4.2 Perfil técnico del colaborador (4 d) · 1.4.3 Proyectos por tipo, categoría y entregables (4 d) · 1.4.4 Importación de colaboradores desde Excel (2 d) · 1.4.5 Pruebas de aceptación Iteración 1 y acta (1 d).
- **1.5 Desarrollo – Iteración 2:** 1.5.1 Integración del servicio de IA (5 d) · 1.5.2 Identificación de perfiles requeridos (4 d) · 1.5.3 Justificación de perfiles (2 d) · 1.5.4 Algoritmo de matchmaking (6 d) · 1.5.5 Recomendación y consulta de personas (2 d) · 1.5.6 Pruebas de aceptación Iteración 2 y acta (1 d).
- **1.6 Desarrollo – Iteración 3:** 1.6.1 Gestión de usuarios · 1.6.2 Gestión de personas · 1.6.3 Gestión de catálogos · 1.6.4 Dashboard y estadísticas · 1.6.5 Reportes consolidados · 1.6.6 Convocatoria por correo (SMTP local) · 1.6.7 Pruebas de aceptación Iteración 3 y acta.
- **1.7 Calidad y despliegue:** 1.7.1 Pruebas funcionales · 1.7.2 Pruebas de integración · 1.7.3 Evaluación del PMV · 1.7.4 Despliegue y documentación final.

## 11. Cronograma (v2.0)

Archivo **Cronograma Conecta U v2.0.xml** (MS Project; abrir y guardar como .mpp). Mismos códigos que la EDT, 75 días laborables del **17/08/2026 al 27/11/2026**, recurso asignado solo a tareas hoja (antes se asignaba también a las resumen y el costo salía duplicado). Hitos: H1 09/10 · H2 06/11 · H3 27/11. Avance al 25/09/2026 (fecha de estado): 1.1, 1.2, 1.3 y 1.4.1 al 100 %; el proyecto va en 39 % y la Iteración 1 en 21 %.

## 12. Costo del proyecto

**Recurso humano:** Estudiante desarrollador — 1 · **75 días** (17/08–27/11/2026) · $140.634/día ($2.812.680/mes ÷ 20 días; $17.579,25/h en MS Project) → **$10.547.550** (coincide con el costo del cronograma).

| Insumo / servicio | Detalle | Costo | Subtotal |
|---|---|---|---|
| Vercel Pro | Frontend (USD 20/mes) | $80.000/mes | $320.000 |
| Render | Backend | $60.000/mes | $240.000 |
| PostgreSQL gestionado | Plan básico | $30.000/mes | $120.000 |
| API de IA | Análisis y pruebas | $100.000/mes | $400.000 |
| Dominio web | 1 año | $60.000/año | $60.000 |
| Utilidades / almacenamiento | Servicios auxiliares | $50.000 | $50.000 |
| Servidor de correo SMTP | Host local, software libre | $0 | $0 |

**Total del proyecto: $11.737.550** ($10.547.550 recurso humano + $1.190.000 insumos). v1.0: $12.490.720 (4 meses de recurso humano, no coincidía con el cronograma).

---

### Cambios v1.0 → v2.0 (25/09/2026)
- Alcance ampliado de solo investigación/semilleros a 4 tipos de proyecto; plantilla dinámica por tipo; categoría y entregables.
- Habilidades blandas en perfiles, en la identificación de perfiles y en el matchmaking.
- Separación **Persona / Usuario**; el matchmaking y la convocatoria trabajan sobre personas.
- HU-13 dividida (usuarios / personas / catálogos); HU-14 pasa a dashboard.
- Nuevas HU-15 a HU-18; RF renumerados RF1–RF22 (consecutivos); RNF9–RNF10; RT13–RT15.
- Importación de colaboradores desde Excel en la **Iteración 1** (plantilla de perfil técnico) y correo por SMTP local (Iter. 3).
- Perfil técnico del colaborador recortado a lo que usa el sistema; niveles Básico–Experto, meses de experiencia y dedicación; catálogos de habilidades y programas; `Collaborator` con `userId` opcional.
- Priorización de HU según la tabla ponderada; secciones 7–11 numeradas como en los lineamientos; costo por días del cronograma.
- Listos para firma: **Acta de Reunión No. 2** y **Acta de Aprobación de RF v2.0** (aprobador: Dra. Judith).
