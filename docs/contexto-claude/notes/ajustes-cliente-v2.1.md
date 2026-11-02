# Ajustes solicitados por la cliente — control de cambios v2.1

_Conecta U · origen: reunión de pruebas de aceptación del **19/10/2026** con la Dra. Judith del Pilar Rodríguez Tenjo (Acta de Reunión No. 3, grabación «Reunion entrega iteracion 1.m4a»)._
_Decisiones del 19/10/2026: los ajustes **se implementan en la Iteración 2 (Corte Tres, 06/11)** y se formalizan como **alcance v2.1** (Alcance v2.1 + Acta de aprobación de RF v2.1 para firma)._

Este documento es el contrato de los ajustes. Desde ahora, todo desarrollo y documento nuevo debe cumplirlos. Complementa a `backend-iteracion-2.md` (IA y matchmaking), que sigue vigente.

---

## 1. Qué pidió la cliente

| # | Ajuste | Lo que dijo (minuto de la grabación) | Estado en el código al 19/10 |
|---|---|---|---|
| **A1** | **Cédula como identificador único de cada persona** (usuarios, líderes, colaboradores e importados) | «La llave primaria aquí debería ser la cédula… qué tal que me aparezcan dos Camilas Rojas, ¿cómo la diferencio?, ¿por el correo? No, por la cédula» (12:15–13:45) | No existe. Las personas se distinguen por correo. |
| **A2** | **Teléfono** obligatorio | «No es suficiente con el correo… el teléfono es fundamental» (12:35–13:05) | No existe. |
| **A3** | **Nacionalidad** | «Nacionalidad, por ejemplo: colombiana, venezolana…» (12:35) | No existe. |
| **A4** | **Correo alterno** (y código institucional) porque el correo institucional se pierde | «El correo se le pierde a todo el mundo… nos quitan el correo… como alterno el código o un correo adicional, pero fundamental la cédula» (15:00–16:00) | No existe. |
| **A5** | **El administrador con los privilegios del líder**: crear proyectos y crear usuarios con su rol, sin modificar lo que pertenece a otro líder | «Como administradora debo tener los mismos privilegios que tiene el líder… no me puedo meter a cambiarle nada, pero sí puedo construir un proyecto… yo puedo crear los usuarios» (08:28–11:45) | Crear usuarios con rol: **ya existe** (pantalla Usuarios, RF14). Crear proyectos: **no**, `POST /projects` es solo `LIDER`. El admin ya ve todos los proyectos. |
| **A6** | **El administrador define los campos de la plantilla de cada tipo de proyecto** (ej. tres palabras clave, costo del proyecto) para que el líder los diligencie | «Cambiaron las reglas del juego… me están pidiendo tres palabras claves… cuánto cuesta este proyecto… yo como administradora agrego» (10:53–11:45) | **Ya existe en parte**: Configuración → Tipos de proyecto permite campos texto, área de texto, número, fecha y lista (RF18). Faltan los tipos **lista de palabras clave** y **valor en pesos**. |
| **A7** | **Ver cuáles habilidades**, no solo cuántas, en la vista del administrador | «Dice cuatro habilidades, pero ¿cuáles son esas cuatro habilidades?» (16:15) | El detalle/listado del admin muestra el conteo. |
| — | Confirmado sin cambios | El administrador crea el catálogo de habilidades; líder y colaborador eligen y pueden **proponer** una nueva para aprobación (16:15–21:34) | Ya funciona (RF3, RF18). |

**Para mostrarle a la cliente en la próxima sesión (ya existe y no lo vio):** crear usuarios con rol (Usuarios) y definir campos de plantilla por tipo (Configuración → Tipos de proyecto).

---

## 2. Decisiones de diseño

1. **Documento de identidad = clave única de negocio, no la llave primaria técnica.** Se conserva el `id uuid` como PK (las FK de todo el modelo dependen de él) y se agrega una **restricción única** sobre (`documentType`, `documentNumber`). Garantiza lo mismo que pidió la cliente (no hay dos personas con la misma cédula) sin migrar todas las relaciones y sin exponer la cédula en URLs o tokens. **Es una decisión técnica interna del equipo (20/10/2026): no se incluye en los documentos de la cliente**; para ella el requisito es que el documento no se repita, y eso se cumple.
2. **Tipo de documento** porque hay personas extranjeras (A3): `CC` cédula de ciudadanía, `TI` tarjeta de identidad, `CE` cédula de extranjería, `PPT` permiso por protección temporal, `PA` pasaporte.
3. **Los datos de identificación viven en la persona** (`collaborators`) y **toda cuenta queda vinculada a una persona** (líder y administrador incluidos), como en la «herencia» usuario–persona que comentó la cliente (14:31). Las personas sin cuenta (importadas) también los tienen.
4. **Privacidad (RNF5, Ley 1581):** documento, teléfono y correo alterno los ven solo la propia persona y el administrador. **Nunca** aparecen en recomendaciones, en el detalle de proyecto ni en respuestas para el líder.
5. **Datos existentes:** las columnas nuevas se crean `NULL` en la base (hay datos de producción y del seed), pero son **obligatorias en los DTO** de creación/registro/importación. A quien le falten se le muestra «Completa tu documento y teléfono» en el perfil, y el admin los ve marcados como incompletos.
6. **El admin crea proyectos a nombre de un líder**: elige el líder responsable (usuario activo con rol LIDER). El proyecto queda del líder; el admin **no** edita proyectos ajenos (`PATCH` sigue siendo solo del dueño).
7. **HU-13 (RF14) y HU-16 (RF18) pasan a la Iteración 2**: ya están implementadas y la cliente las pidió; se validan en la sesión del 29/10. La Iteración 3 queda con HU-14, HU-15 y HU-18.

---

## 3. Cambios en el backend (`conecta-u-back`)

### 3.1 Migración `AddPersonIdentification`
`collaborators`:
| Columna | Tipo | Notas |
|---|---|---|
| documentType | varchar(4) null | `CC`, `TI`, `CE`, `PPT`, `PA` |
| documentNumber | varchar(20) null | solo dígitos para CC/TI/CE; alfanumérico para PPT/PA; sin puntos ni espacios (normalizar) |
| phone | varchar(20) null | 7 a 15 dígitos, `+` opcional (celular colombiano: 10 dígitos) |
| nationality | varchar(60) null | catálogo de países (seed: Colombia, Venezuela, Ecuador, Perú, Otro…) o texto |
| alternateEmail | varchar(254) null | distinto del correo principal |
| institutionalCode | varchar(20) null | código estudiantil o de docente, opcional |

- Índice único parcial: `UNIQUE (documentType, documentNumber) WHERE documentNumber IS NOT NULL`.
- Límites en `domain/entities/field-limits.ts`; tipo `DocumentType` en dominio; normalización en `shared/utils` (`normalizeDocumentNumber`).

### 3.2 Registro y cuentas (RF1, RF14)
- `RegisterDto` y `CreateUserDto`: `documentType`, `documentNumber`, `phone`, `nationality` obligatorios; `alternateEmail`, `institutionalCode` opcionales.
- Toda cuenta (LIDER, COLABORADOR y ADMIN creada por el admin) queda vinculada a una persona. Vínculo: primero por documento; si no, por correo; si no existe, se crea la persona.
- Errores 409: «El documento ya está registrado en otra cuenta», «El correo ya está registrado». Si el documento existe en una persona **sin** cuenta (importada) y el correo coincide o está vacío, se vincula (es el caso de alguien cargado por Excel que luego se registra).

### 3.3 Perfil (RF3) y personas (RF17)
- `UpdateMyCollaboratorProfileDto`: los campos nuevos (cambiar documento: solo el admin, para evitar suplantación; la persona puede corregir teléfono, nacionalidad y correos).
- Mappers: el perfil propio y las vistas del admin incluyen identificación; los mappers de recomendaciones, proyectos y listados para el líder **no**.

### 3.4 Importación Excel (RF19–RF20)
- Hoja «Colaboradores»: columnas nuevas `tipo_documento` (lista), `numero_documento`, `telefono`, `nacionalidad` (lista), `correo_alterno`, `codigo`. Actualizar la plantilla que descarga la aplicación y su guía.
- Validaciones: obligatorios; formato por tipo; **documento duplicado en el archivo** y **documento ya registrado** → fila rechazada con hoja, fila y causa; las filas de Habilidades y Experiencia se asocian por documento (además del correo, por compatibilidad).
- Actualizar `postman/` y la plantilla de prueba con datos **ficticios** (números de documento inventados, marcados como de prueba).

### 3.5 Proyectos (RF6, RF7)
- `POST /projects`: `@Authorize({ anyOfRoles: ['LIDER','ADMIN'] })`. Si es ADMIN, `leaderId` obligatorio (usuario activo con rol LIDER, si no 422); si es LIDER, se ignora y se usa el propio.
- `GET /projects` y `GET /projects/:id` para ADMIN: todos, con nombre del líder y **lista de habilidades por nombre y tipo** (A7). `PATCH /projects/:id`: solo el líder dueño (403 para el admin).
- Auditoría simple: `createdById` en `projects` (quién lo registró: líder o admin).

### 3.6 Plantillas de tipo de proyecto (RF18)
- `TemplateField.kind` agrega `tags` (lista de palabras clave; `minItems`/`maxItems`, ej. 3 y 5) y `currency` (valor en pesos colombianos, entero ≥ 0).
- Validación de `typeData` en crear/actualizar proyecto según el nuevo `kind`.
- Seed: agregar a los tipos existentes los campos de ejemplo «Palabras clave» (`tags`, 3–5, obligatorio) y «Costo estimado del proyecto» (`currency`, opcional), para mostrarlos en la sesión.

---

## 4. Cambios en el frontend (`conecta-u`)

- **Registro** (`RegisterForm`) y **crear/editar usuario** (`UserModal`): tipo y número de documento, teléfono, nacionalidad, correo alterno y código; mensajes de error por campo y 409.
- **Mi perfil**: sección «Identificación y contacto»; aviso «Completa tu documento y teléfono» cuando falten.
- **Colaboradores (admin)**: columna documento y filtro/búsqueda por documento; marca de «datos incompletos».
- **Proyectos (admin)**: botón «Registrar proyecto» con selector de **líder responsable**; listado y detalle con el líder y las **habilidades por nombre** (A7).
- **Configuración → Tipos de proyecto** (`ProjectTypeModal`): tipos «Lista de palabras clave» (mín./máx.) y «Valor en pesos»; `DynamicTypeFields` los pinta (chips y campo con formato $ COP) y `ProjectView` los muestra.
- **Importar**: guía de la plantilla con las columnas nuevas.
- Actualizar Figma: registro, perfil, crear usuario, registrar proyecto (admin) y modal de tipo de proyecto.

---

## 5. Pruebas

- Unitarias: normalización y validación de documento por tipo; vínculo cuenta–persona por documento/correo; 409 por documento duplicado; admin crea proyecto con `leaderId` (válido, inexistente, no líder); admin no puede `PATCH`; validación de `tags` y `currency`; importación con documento duplicado en archivo y en base.
- Que ningún mapper de recomendaciones/proyectos para el líder devuelva documento, teléfono ni correo alterno.
- Aceptación con la cliente: se agregan a la **sesión 1 (29/10)**: ajustes v2.1 de RF1, RF3, RF6, RF7, RF19–RF20, más RF14 y RF18.

---

## 6. Documentos que cambian

| Documento | Cambio | Estado |
|---|---|---|
| Alcance v2.1 | HU-01, 03, 07, 08, 14, 16, 17, 18; RF1, 3, 7, 11, 18, 21, 22, 23, 24; RNF5, RNF9; RT4; plan de iteraciones (HU-13 y HU-16 a la Iteración 2) | Hecho 19/10 (borrador para firma) |
| Acta de aprobación de RF v2.1 | Distribución por corte y sección de control de cambios | Hecho 19/10, en la carpeta de firmas |
| Cronograma (Entrega 3) | Tareas del control de cambios sin tocar la línea base 1 | Hecho 19/10 |
| FP-15 Iteración 2 | 1.1–1.4 con HU-13, HU-16 y los RF modificados; 2.1/2.2 con los campos nuevos; 4.1 con sus pruebas | Pendiente (28/10) |
| Figma | Pantallas del punto 4 | Pendiente (27/10) |

---

## 7. Orden de trabajo

1. 21/10–23/10 — A1–A4: migración, registro, cuentas, perfil, importación (back y front).
2. 26/10 — A5 y A7: admin registra proyectos y ve habilidades por nombre.
3. 27/10 — A6: tipos `tags` y `currency`, seed de ejemplo.
4. 28/10 — FP-15 Iteración 2 y Figma con los cambios; preparar la sesión del 29/10.

Cada bloque cierra con lint, tests, build, actualización de `notes/estado-desarrollo.md` y **un commit** (`feat(v2.1): ...`), para que las fechas del repositorio sean la evidencia.

---

## 8. Prompt para Claude Code

```
Vamos a implementar los ajustes v2.1 que pidió la cliente el 19/10 (Acta No. 3).
Lee primero notes/ajustes-cliente-v2.1.md (contrato de estos ajustes), y como contexto
notes/backend-iteracion-2.md, notes/plan-ajuste-clean-code.md y, en el front, notes/reglas-frontend.md.
Resume en 10 líneas lo que entendiste y tus dudas; no codifiques hasta que confirme.

Reglas: arquitectura por capas y convenciones existentes; PK uuid intacta y documento como
clave única (tipo + número); datos de identificación solo para la propia persona y el ADMIN
(nunca en recomendaciones ni vistas del líder); columnas nuevas NULL en la base pero
obligatorias en los DTO; datos de prueba ficticios; no romper la Iteración 2 que está en develop.

Bloques (un commit "feat(v2.1): ..." por bloque, con lint + tests + build en verde y
notes/estado-desarrollo.md actualizado):
1) A1–A4: migración AddPersonIdentification, DocumentType, normalización, registro/crear usuario
   con vínculo por documento, perfil, admin de colaboradores, importación Excel (plantilla, guía,
   validaciones de documento duplicado), postman y seed. Front: RegisterForm, UserModal, Mi perfil,
   Colaboradores, guía de importación.
2) A5 + A7: POST /projects para ADMIN con leaderId; createdById; GET de admin con líder y
   habilidades por nombre; PATCH solo dueño. Front: registrar proyecto como admin con selector de
   líder y habilidades por nombre en listado/detalle.
3) A6: TemplateField kinds 'tags' (minItems/maxItems) y 'currency'; validación de typeData;
   seed con "Palabras clave" y "Costo estimado del proyecto". Front: ProjectTypeModal,
   DynamicTypeFields, ProjectView.
Al final: pasa clean-code-reviewer sobre lo nuevo, corrige, y dame la lista de pantallas que
cambiaron para actualizar Figma y el FP-15.
```
