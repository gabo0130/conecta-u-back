# Reglas del frontend — Conecta U (`conecta-u`)

> Reglas de código para el frontend Next.js. Salen de los patrones que ya usa el repo (25/09/2026). Si una regla choca con lo que pide la tarea, se pregunta antes de romperla. Código nuevo o tocado debe cumplirlas; el código existente se corrige cuando se pasa por él, no en barridos aparte.

## 1. Estructura y ubicación

| Qué | Dónde | Ejemplo |
|---|---|---|
| Página | `src/app/<ruta-en-español>/page.tsx` + `<ruta>.module.css` | `app/(protected)/users/page.tsx`, `users.module.css` |
| Página privada | dentro de `src/app/(protected)/` (la protege `ProtectedRoute` desde el layout) | `(protected)/perfil` |
| Componente | `src/components/<nivel>/<Nombre>/<Nombre>.tsx` + `<Nombre>.module.css` | `atoms/Button/Button.tsx` |
| Tipos de la API | `src/apis/interfaces/<dominio>.ts` | `catalogs.ts`, `collaborator.ts` |
| Hook de datos (uno por carpeta, con el mismo nombre) | `src/modules/<dominio>/hooks/<useX>/useX.ts` | `modules/catalogs/hooks/useProgramsCatalog/useProgramsCatalog.ts` |
| Utilidad de un dominio | `src/modules/<dominio>/utils/<kebab-case>.ts` | `modules/projects/utils/project-view.ts` |
| Utilidad transversal | `src/utils/<kebab-case>.ts` | `utils/get-error-message.ts`, `utils/notify.ts`, `utils/loading.ts`, `utils/service-status.ts` |
| Sesión | `src/contexts/auth-context.tsx` (`useAuth()`) | — |

- **Rutas de URL en español** (`/proyectos/nuevo`, `/perfil`); las del ADMIN que vienen del menú del backend se respetan tal cual (`/users`, `/settings`).
- **No crear carpetas vacías con `.gitkeep`** para cosas que no se van a hacer ahora.

## 2. Atomic design

- **atoms:** piezas sin lógica de negocio ni llamadas a la API (`Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Checkbox`, `FormRow`, `FormError`, `Modal`, `Badge`, `Card`). Los tipos compartidos de los átomos van en `atoms/types.ts` (`ControlSize`).
- **molecules:** combinan átomos para una tarea puntual; reciben datos por props y **no llaman a la API** (`DeliverablesEditor`, `ExperienceItem`, `NotificationDialog`, `LoadingState`, `Pagination`). Si un componente usa hooks de datos o llama a la API, es un organismo (por eso `LoginForm` y `RegisterForm` están en `organisms`).
- **organisms:** bloques de pantalla; **pueden** usar hooks de catálogo o de dominio (`SkillPicker`, `ProjectForm`, `ProjectView`, `DynamicTypeFields`, `ProfileModals`, `NotificationHost`).
- **templates:** la estructura de la página (`AppShell`, `AuthLayout`, `PageGrid`).
- **Páginas:** juntan el template, los organisms y los hooks de datos. La lógica de negocio va en los hooks o en `utils`, no en el JSX.
- Todo componente nuevo se **exporta desde el `index.ts` de su nivel** (y sus tipos públicos con `export type`). Fuera de `components/`, siempre se importa desde el barrel: `import { Button } from "@/components/atoms"`.
- Dentro de `components/`, un componente importa a otro de un nivel inferior con ruta relativa al barrel (`"../../atoms"`) y a uno del mismo nivel con ruta directa (`"../SkillPicker/SkillPicker"`), para no crear ciclos.
- Antes de crear un componente, **buscar si ya existe uno que sirva** o que se pueda extender con una prop (como `onRightIconClick` en `Input`).

## 3. TypeScript y estilo de código

- `strict` activo: **nada de `any`** ni `as` para callar errores. Si un tipo no encaja, se corrige el tipo.
  - Selects: `<Select options={LEVEL_OPTIONS} value={level} onValueChange={setLevel} />` entrega el valor ya tipado (nada de `event.target.value as SkillLevel`). Las opciones se derivan de los mapas de etiquetas con `toOptions` (`utils/to-options.ts`, la única conversión de `Object.entries`).
  - Eventos del DOM: `event.target instanceof Node`, `document.activeElement instanceof HTMLElement` en vez de `as`.
- Alias `@/` para todo lo que esté fuera de `components/`.
- **Componentes y hooks con `export function`**, sin `export default`, salvo `page.tsx`/`layout.tsx`, que Next exige como default.
- Props como `type <Nombre>Props = …`. Al extender elementos HTML: `Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {...}` y pasar `...props`.
- Clases combinadas con `[styles.a, cond && styles.b, className].filter(Boolean).join(" ")`.
- `"use client"` solo donde hace falta (hooks, estado, eventos). Los hooks de datos y las páginas con estado lo llevan.
- Nombres: componentes en `PascalCase`, hooks `useX`, archivos de utilidades en `kebab-case`, constantes de mapeo en `UPPER_SNAKE` (`ROLE_LABEL`).
- **Código y nombres en inglés; textos de UI y comentarios en español.** Los comentarios explican el *porqué*, no lo que ya dice el código.
- Tipos importados con `import type`.

## 4. Datos y API

- **Toda llamada HTTP pasa por `apiClient` (`@/apis/client`)**, que agrega el JWT y maneja el 401. No usar `fetch` ni crear otras instancias de axios. `hooks/useApiClient.ts` está obsoleto (usa `any`): no usarlo en código nuevo.
- **Contrato:** las rutas, DTOs y enums salen de `notes/backend-iteracion-1.md` y de la respuesta real del backend. **No cambiar ni inventar una ruta en el front antes de que exista en el back.** Si el backend devuelve algo distinto al contrato, se ajusta la interfaz a la respuesta real y se anota en `estado-desarrollo.md`.
- Las **interfaces** replican la respuesta: la entidad (`Program`), la envoltura de la lista (`ProgramsResponse { programs: Program[] }`) y los cuerpos de envío como `<Acción>Payload` (`CreateUserPayload`, `ExperiencePayload`). Los enums del backend van como uniones de strings con los mismos valores (`"BASICO" | "INTERMEDIO" | …`).
- **Patrón de hook de datos** (el mismo de `useUsers`, `useCollaborator`, `useProgramsCatalog`):
  - estado `data`, `isLoading` (inicia en `true`), `error` (string vacío si no hay error);
  - un `reload` con `useCallback` y un `useEffect(() => { void reload(); }, [reload])`;
  - las mutaciones hacen `await request()` y después `await reload()` (se muestra el estado del servidor, sin actualizaciones optimistas);
  - devuelve un objeto con nombre: `{ users, isLoading, error, reload, createUser, … }`.
- Los estados especiales se tratan en el hook, no en la página (p. ej. el 404 de `/collaborators/me` se convierte en `notFound`).
- En las búsquedas mientras se escribe, se descartan las respuestas viejas que lleguen tarde (ver el guard de `useSkillsCatalog`).
- **Catálogos que casi no cambian** (programas, tipos y categorías de proyecto) se piden una sola vez por pestaña con `createSharedRequest` (`apis/shared-request.ts`) + `useSharedCatalog`: la vista, el formulario y los modales de una pantalla usan el mismo hook sin volver a pedir. Un fallo no queda guardado y `reload()` fuerza una petición nueva. No usarlo para datos que el usuario edita (perfil, proyectos, usuarios).
- **No se usa React Query** aunque esté en `package.json`: no mezclar dos maneras de traer datos. Si se decide migrar, se migra todo en una tarea aparte.

## 5. Errores, notificaciones y estados de la pantalla

**Toda acción notifica su resultado en un modal** que se ve sí o sí. Se usa `notify`, llamable desde cualquier parte (componentes, hooks, utilidades), y un único `<NotificationHost />` montado en `app/layout.tsx`:

```ts
import { notify } from "@/utils/notify";

notify.success("La experiencia se agregó a tu perfil.");
notify.error(getErrorMessage(err, "No se pudo guardar el proyecto."));
notify.info("Quedará pendiente hasta que un administrador la revise.", { title: "Habilidad propuesta" });
notify.warning("Tu sesión vence en 5 minutos.");
if (await notify.confirm({ title: "¿Eliminar usuario?", message: "…no se puede deshacer.", tone: "danger" })) { … }
```

| Tipo | Cuándo | Título por defecto | Botón |
|---|---|---|---|
| `success` | La acción terminó bien (crear, guardar, eliminar, registrarse) | ¡Listo! | Entendido |
| `error` | El backend o la red fallaron al ejecutar una acción | Algo salió mal | Cerrar |
| `info` | Dato que la persona debe saber tras una acción (habilidad propuesta queda PENDIENTE) | Información | Entendido |
| `warning` | Algo requiere atención pero no falló | Atención | Entendido |
| `confirm` | Antes de una acción que la persona debe aprobar | ¿Estás seguro? | Cancelar / Confirmar |
| `confirm` + `tone: "danger"` | **Antes de toda eliminación o acción irreversible**: el foco inicial va a Cancelar | ¿Estás seguro? | Cancelar / Eliminar |

- **Qué va en modal y qué no:**
  - **Modal (`notify`)**: el resultado de toda acción que cambia datos o sesión (éxito y error del backend), las confirmaciones de eliminación y los avisos que la persona debe leer. Nunca se reemplaza por un texto en la página que pueda pasar desapercibido.
  - **En línea (`FormError` o `error` del campo)**: solo las **validaciones del formulario** en el cliente (obligatorios, rangos, contraseñas que no coinciden), para que se corrijan sin perder lo escrito.
  - **En la página**: los errores al **cargar** datos de una vista (los cuatro estados de abajo); no son acciones.
- Los mensajes dicen **qué pasó con qué**: "La habilidad se eliminó de tu perfil.", `"${project.title}" quedó registrado.`, "Se eliminará la cuenta de Laura Méndez (correo). Esta acción no se puede deshacer." Nada de "Operación exitosa".
- Se llama con `void notify.success(...)` cuando no hace falta esperar; con `await` solo si lo siguiente depende del cierre (siempre en `confirm`). Tras una navegación (`router.push`) la notificación se sigue viendo porque el host vive en el layout raíz.
- Las notificaciones se muestran de a una, en orden, **por encima** de los modales de formulario (z-index 60 vs 50). Escape o clic fuera cierran (en `confirm` equivalen a Cancelar) y no cierran el formulario de abajo.
- Mensajes de error siempre con `getErrorMessage(err, "<fallback en español>")`. El fallback dice qué falló: "No se pudieron cargar los programas.", "No se pudo guardar. Intenta nuevamente."
- Toda vista que carga datos muestra **los cuatro estados**: cargando, error, vacío ("Aún no hay usuarios registrados.") y con datos.
- **Todo lo que espera datos del backend muestra un spinner**, nunca un texto plano ni un valor falso (un "0" o "Sin definir" mientras carga):
  - Pantalla o sección: `<LoadingState message="Cargando usuarios…" />` (molécula; `variant="page"` cuando ocupa la pantalla entera, `section` dentro de una tarjeta o lista).
  - Select que depende de un catálogo: `<Select isLoading={isLoadingPrograms} … />` (spinner en lugar del chevron, deshabilitado mientras tanto).
  - Contador: `<StatCard isLoading … />`. Dato suelto dentro de una vista (nombre que sale de un catálogo): `<Spinner size="sm" label="Cargando …" />` en línea.
  - Todos usan el átomo `Spinner`; no crear animaciones de carga propias.
- Los campos (`Input`, `Select`, `Textarea`) enlazan su ayuda o error con `aria-describedby` y marcan `aria-invalid`; el `id` sale de `useId()` (nunca del texto del label, que se repetía).
- `Modal`: foco en el primer campo al abrir, Tab no sale del diálogo, el foco vuelve al botón que lo abrió, y mientras `isSubmitting` no se cierra (Escape, clic fuera ni Cancelar).
- Formularios: botón deshabilitado mientras se envía (`isSubmitting`); el modal de formulario se cierra solo cuando el guardado sale bien (y entonces aparece la notificación de éxito); si falla, queda abierto con lo escrito y aparece la notificación de error.
- Los números de los formularios se validan con `validateInteger` (`modules/collaborator/utils/collaborator-limits.ts`, mismos rangos que el backend): un campo vacío **nunca** se envía como 0, y un opcional vacío se envía como `null` para borrar el valor guardado.
- Los modales de formulario llevan `noValidate`: la validación nativa del navegador (`min`/`max`) bloqueaba el envío con su propio globo; todo error se muestra en línea y en español.
- Las etiquetas en español de los enums viven **una sola vez** en `modules/collaborator/utils/collaborator-view.ts` (y las de habilidades en `SkillPicker/skill-type.ts`), con sus opciones de select derivadas. No copiar mapas de etiquetas en los componentes.
- Buscar, filtrar u **ordenar** un listado paginado revisa **todas** las páginas (`useAllPages` + `useLocalPage`), nunca solo la cargada; y los conteos del dashboard se calculan sobre el total. Después de crear, editar o borrar, `useAllPages().invalidate()` descarta la copia.

**Tablas**

- **Ordenamiento en toda tabla:** una sola columna a la vez, con `useTableSort(ACCESSORS)` + `<SortableHeader>` en cada `<th>` ordenable. Un clic cicla ascendente → descendente → sin orden (vuelve al orden del backend); `aria-sort` en la celda. Se compara en español (`Intl.Collator`, sin distinguir mayúsculas ni tildes, números naturales) y los vacíos van siempre al final. Los `accessors` (constante del módulo) dicen qué se compara: el texto que se ve (etiquetas traducidas, no el enum crudo), números como números, fechas ISO como texto, y para enums con orden propio un rango (disponibilidad: Disponible → Parcial → No disponible). Columnas numéricas alineadas a la derecha: `className` de la celda + `align="end"`. Sin orden por varias columnas: complica la interfaz y no lo pide ningún caso.
- **Acciones de fila con ícono:** `IconButton variant="plain" size="sm"` con `tooltip` (etiqueta visible al pasar el mouse o con Tab, alineada con `tooltipAlign="end"` en la última columna) y `label` con el nombre del registro (`Editar a Laura Méndez`). Íconos: lápiz `Pencil` = editar, ojo `Eye` = ver detalle (con `href`, es un enlace), `Check` (`tone="success"`) = aprobar, `Trash2`/`X` (`tone="danger"`) = eliminar/rechazar. Si la fila entera abre el registro, igual lleva el botón (teclado) y el `onClick` hace `stopPropagation`.
- **Enlaces de navegación sueltos** ("Ver todos", "Ver perfil técnico"): átomo `ArrowLink`, texto + flecha.
- **Solo ícono vs. ícono + texto:** solo ícono en acciones repetidas por fila (tablas, listas densas). Ícono + texto en acciones únicas de una página o tarjeta (Crear usuario, Editar proyecto, Editar perfil, Editar/Descartar en `RequiredProfileCard`), donde hay espacio y el texto evita adivinar.
- Validar en el cliente lo que el backend también valida (obligatorios, rangos como `weeklyHours` 0–60 o `experienceMonths` 0–600, entregables ≥ 1), pero **el backend manda**: su 400 se muestra con `notify.error`.
- No crear otros sistemas de avisos (toasts, banners de éxito, `alert()`/`confirm()` del navegador): todo pasa por `notify`.

**Carga global (`loading`)** — para acciones que tardan y durante las cuales no se debe tocar la pantalla (guardar, importar, procesos largos):

```ts
import { loading } from "@/utils/loading";

const project = await loading.run(createProject(payload), "Guardando proyecto…");

const stop = loading.start("Importando colaboradores…");
try { … } finally { stop(); }
```

- El overlay (`<LoadingHost />`, layout raíz) bloquea los clics desde el primer instante y solo se hace visible si la acción dura más de ~200 ms. Varias acciones se apilan; se muestra el mensaje de la más reciente.
- El mensaje dice qué se está haciendo ("Guardando cambios…"), nunca solo "Cargando…".
- Para cargar los datos de una vista se usa el estado "cargando" de la página (sección de los cuatro estados), no el overlay. El overlay es para **acciones**. Los botones siguen mostrando su texto de envío ("Guardando…").

**Estado del servidor (`serviceStatus`)** — el backend está en un plan gratuito que se apaga sin uso y tarda hasta ~5 min en arrancar:

- `<ServiceStatusHost />` (layout raíz) consulta `/health` cada vez que alguien entra a la app, por cualquier ruta. Si tarda más de 4 s o falla (timeout, sin red, 502/503/504), muestra el aviso "Estamos levantando el servidor" con tiempo transcurrido, intento y "Reintentar ahora", y reintenta solo (3 s → 5 s → 8 s → 10 s) hasta 6 min; después muestra "No pudimos conectar". Al volver, avisa "El servidor ya está disponible" con "Actualizar página".
- `apiClient` llama a `reportUnreachable()` cuando una petición falla sin respuesta o con 502/503/504: el aviso aparece aunque el servidor se caiga en medio de la visita. No hace falta manejar ese caso en cada pantalla.
- `<ServiceStatusButton />` es el botón de diagnóstico/levantamiento (barra superior y login/registro): el punto muestra el estado (verde en línea, ámbar levantándose, rojo sin conexión) y al pulsarlo mide la respuesta o despierta el servidor.
- Capas (z-index): notificaciones 60 > aviso del servidor 57 > carga global 55 > modales de formulario 50.

## 6. Estilos

- **Solo CSS Modules.** No usar Tailwind (está instalado por la plantilla, pero no se usa) ni agregar librerías de UI o de estilos sin preguntar.
- **Cero colores hex en los `.module.css`**: todo color sale de `globals.css`. Se permite `#fff`/`#ffffff`. Si falta un tono, se agrega ahí con un nombre por su uso. Paleta disponible:
  - Marca: `--c-red`, `--c-red-dark`, `--c-red-soft`, `--c-red-ink` (texto sobre `--c-red-soft`), `--c-on-red-muted` (texto secundario sobre `--c-red`).
  - Neutros, de oscuro a claro: `--c-ink`, `--c-ink-2` (etiquetas), `--c-ink-3` (navegación, texto secundario), `--c-muted`, `--c-muted-2`, `--c-muted-3` (separadores), `--c-line`, `--c-line-2`, `--c-line-soft`, `--c-hover`, `--c-bg`, `--c-card`.
  - Estados: `--c-green(-soft)`, `--c-amber(-soft)`, `--c-danger`.
  - Interacción (hover): `--c-hover` (neutros: filas, botones ghost, opciones), `--c-red-hover`, `--c-green-hover` y `--c-danger-hover` (~15–25 % del color, el doble de visibles que los `-soft`). Un `:hover` nunca usa `--c-bg` ni un `-soft` como fondo: se confunden con el reposo.
  - Radios: `--r-sm`, `--r-md`, `--r-lg`, `--r-pill`.
- `style={{}}` solo para valores calculados en tiempo de ejecución (ancho de una barra de progreso, tamaño que llega por prop). Lo estático va al `.module.css`.
- Clases en `camelCase` dentro del módulo (`.editCol`, `.labelWithIcon`).
- Íconos solo de `lucide-react`, con `size` explícito y `aria-hidden` si son decorativos.
- **Para ocultar o cambiar el `display` de un átomo desde fuera** (un `Button` o `IconButton` que se esconde en cierto ancho), usar un selector con el padre (`.banner .bannerBtn`, `.top .menu`). Con una sola clase gana o pierde según el orden de carga del CSS.

## 7. Responsive (siempre, sin excepción) — mobile-first

Toda pantalla y todo componente debe **adaptarse por completo** a cualquier ancho, de 320 px a escritorio. Una tarea con interfaz no está terminada si no se revisó en móvil.

**Breakpoints** (documentados en la cabecera de `globals.css`). Los media queries no aceptan variables CSS, así que se escriben con estos valores exactos:

| Nombre | Media query | Qué pasa en el layout actual |
|---|---|---|
| (base) | sin media query | Móvil: una columna, paddings de 16 px, sidebar como panel deslizable, modales pegados abajo, letra de campo de 16 px |
| `sm` | `@media (min-width: 640px)` | Las filas de `FormRow` se abren en columnas, paddings de 28 px, modales centrados, aparecen el breadcrumb y el nombre del usuario, letra de campo según su tamaño |
| `md` | `@media (min-width: 768px)` | Grillas de página en 2–3 columnas (dashboard, perfil, análisis), tarjetas de recomendación en fila |
| `lg` | `@media (min-width: 1024px)` | Sidebar fijo (248 px), se oculta el botón de menú, aparece el panel rojo del login/registro |
| `xl` | `@media (min-width: 1280px)` | Columnas laterales de apoyo (consejos de "Nuevo proyecto") |

- **Toda página se arma con `PageGrid`** (template), dentro de `AppShell`. Nada de `div` con `max-width` suelto por página ni contenido pegado a la izquierda en pantallas grandes:
  - `AppShell` ya centra el área de contenido (máx. 1280 px + padding).
  - `<PageGrid header={…}>` centra la página en una columna de **820 px** (formularios, lectura).
  - `<PageGrid width="wide">` llega a **1180 px** para contenido que se reparte en columnas desde `xl` (vistas de detalle como `ProjectView`, listados con tarjetas).
  - `<PageGrid aside={…}>` agrega una **columna lateral de 340 px** desde `xl` (consejos, resumen, filtros), fija al hacer scroll; antes de `xl` va debajo del contenido.
  - El encabezado de la página (título, subtítulo, acciones) va en `header` para alinearse con el contenido.
- **Ordenar con grid, no apilando todo**: cuando sobra ancho, las secciones relacionadas van en columnas (`grid-template-columns: minmax(0, 1fr) 340px`) en vez de una debajo de otra. Si el orden visual en columnas difiere del de lectura en móvil, se usan contenedores de columna con `display: contents` + `order` en móvil (ver `ProjectView`), para no duplicar componentes.
- **Mobile-first obligatorio:** los estilos sin media query son los de móvil y cada breakpoint **agrega** con `min-width`. No usar `max-width` en media queries ni valores fuera de la tabla (antes había 560, 720, 760, 860 y 960 sueltos).
- **Nada desborda horizontalmente**: `document.documentElement.scrollWidth` debe ser igual al ancho de la ventana. Si algo es más ancho por naturaleza (una tabla), se desplaza **dentro** de su contenedor (`overflow-x: auto`, como `.tableWrap` en `users`), nunca la página.
- **Diseñar fluido, no con anchos fijos**: `width: 100%` + `max-width`, `minmax(0, 1fr)` en grillas, `flex-wrap` en barras de acciones y cabeceras, `min-width: 0` en hijos de flex/grid que contienen texto o inputs. Nada de `width` en px para contenedores (se permite en íconos, avatares, botones cuadrados y el sidebar desde `lg`).
- **En grillas, siempre `minmax(0, 1fr)`**, nunca `1fr` solo: `1fr` deja que el ancho mínimo de un `<input>` o `<select>` agrande su columna y rompa la alineación.
- Textos largos (correos, títulos de proyecto): `overflow-wrap: anywhere` o `text-overflow: ellipsis`; nunca deben empujar el layout.
- Objetivos táctiles de al menos 40 × 40 px en móvil: la escala ya lo garantiza (los controles `sm` miden 40 px por debajo de `sm`).
- Probar en 320/375 px, 768 px, 1024 px y 1280 px con el navegador, además del `scrollWidth`.

## 8. Tamaños de controles y formularios coordinados

Botones y campos comparten **una escala de tamaños**: `sm | md | lg | xl` (tipo `ControlSize`, exportado desde `@/components/atoms`). Un formulario se ve como **un solo bloque alineado**: ningún campo es más alto, más ancho o con otro borde que su vecino, sin importar su tipo.

| Tamaño | Alto del control | Letra de campo* / botón | Etiqueta | Ayuda y error | Checkbox | Íconos | Separación etiqueta ↔ campo / entre campos | Uso |
|---|---|---|---|---|---|---|---|---|
| `sm` | 36 px (40 en móvil) | 13.5 px | 12.5 px | 11.5 px | 14 px | 16 px | 6 / 10 px | Acciones dentro de tarjetas, filtros, formularios compactos |
| `md` (por defecto) | 46 px | 14.5 px | 13 px | 12 px | 16 px | 18 px | 7 / 14 px | Formularios y acciones de página |
| `lg` | 52 px | 15.5 px | 13.5 px | 12.5 px | 18 px | 20 px | 8 / 16 px | Login/registro, formularios destacados |
| `xl` | 58 px | 16.5 px | 14 px | 13 px | 20 px | 22 px | 9 / 18 px | Llamados a la acción de portada |

\* Por debajo de `sm`, la letra de los campos es como mínimo 16 px (con menos, iOS hace zoom al enfocar).

La escala cubre **todo** lo que compone un campo, no solo el control: alto, padding, radio, letra del valor, letra de la etiqueta, letra de ayuda/error, separación etiqueta ↔ control, separación entre campos, tamaño del checkbox, íconos dentro del control (ojo de contraseña, chevron del select, papelera, cerrar chip) y las opciones de los desplegables propios (`--option-py`, `--option-font`). Los íconos dentro de un control **no llevan `size`**: el CSS del átomo los dimensiona con `--field-icon`.

- **Cómo se usa:** aceptan `size` todos los controles (`Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Checkbox`, `SkillPicker`), los contenedores de campos (`FormRow`, `FormError`, `DynamicTypeFields`, `DeliverablesEditor`, `Modal`) y los formularios (`LoginForm`, `RegisterForm`, `ProjectForm`). Sin `size` **heredan** el del contenedor más cercano con `data-size`, así que un formulario completo se cambia en un solo lugar: `<ProjectForm size="sm">`, `<Modal size="lg">` o `<form data-size="lg">`. No mezclar tamaños dentro de una misma fila; el botón principal puede ir un tamaño arriba (login/registro usan `lg` por defecto).
- **La escala vive en `globals.css`** (`[data-size="…"]` define `--field-h`, `--field-px`, `--field-radius`, `--field-font`, `--field-label-font`, `--field-msg-font`, `--field-gap`, `--field-stack-gap`, `--field-icon`, `--check-size`, `--check-font`, `--option-py`, `--option-font`, `--btn-px`, `--btn-font`). Todo componente de formulario nuevo usa estas variables para medidas, letras y separaciones: ningún px fijo. Ningún componente escribe su propia altura, padding, radio o letra de control, ni redefine el alto de un `Button` con `className` (antes había botones de 38, 40 y 48 px hechos así): se usa `size`.
- **La altura va en el elemento que lleva el borde.** Si un campo tiene contenedor (Input con ícono), el contenedor mide `--field-h` y el `<input>` interno `height: 100%` sin borde. Así un `Input`, un `Input` con ícono interactivo (ojo de contraseña), un `Select`, un `SkillPicker` y un `Input type="date"` miden exactamente lo mismo, y un `Button` o `IconButton` del mismo tamaño queda alineado con ellos.
- **Átomos disponibles** (usarlos siempre):
  - `Button` — variantes `primary`, `ghost`, `white`, `link` (aspecto de enlace, alto según el texto: "+ Agregar", "Eliminar"); `fullWidth`; `type="button"` por defecto (un submit se declara con `type="submit"`).
  - `IconButton` — botón cuadrado de solo ícono, del alto del campo; `label` obligatorio (es el `aria-label`); variantes `ghost` (con borde, junto a un campo) y `plain` (sin borde, dentro de tarjetas); `tone="danger"` para eliminar y `tone="success"` para aprobar; `tooltip` para una etiqueta visible; `href` para navegar con el mismo aspecto.
  - `Input`, `Select`, `Textarea`, `Checkbox`, `SkillPicker` — todos con `label`, `helperText` y `error` con el mismo estilo (el error pinta el borde con `--c-danger`).
  - `FormRow` — `columns={1|2|3}`, columnas iguales que se abren desde `sm`. Si una fila queda con un solo campo (un campo condicional que no aparece), usar `columns={1}`.
  - `FormError` — el mensaje de error del formulario completo (validación o respuesta del backend), con `role="alert"`. Nada de `.error`/`.formError` propios.
- **Nada de `<button>`, `<input>`, `<select>` o `<textarea>` sueltos** en páginas, moléculas u organismos. Excepciones aceptadas, porque no son controles de formulario: ítems de navegación del `Sidebar`, chips y filtros tipo píldora, las opciones internas de un desplegable propio (`SkillPicker`), el botón de orden de `SortableHeader` y el buscador de la `TopBar`. Si un átomo no cubre un caso, se le agrega una prop o una variante.
- **Un `<select>` nunca va dentro de un `<label>`**: se asocian con `htmlFor`/`id`. En Firefox, dentro de un label la lista se abre y se cierra de inmediato por el clic reenviado.
- **Desplegables propios** (autocompletado como `SkillPicker`): mientras llega una búsqueda nueva se **mantienen los resultados anteriores**. Nunca se reemplaza la lista por "Buscando…" (la lista se encoge y crece con cada tecla); "Buscando…" solo cuando todavía no hay nada que mostrar. Las acciones que dependen del resultado ("Proponer habilidad") aparecen solo cuando los resultados corresponden al texto actual. Debounce de 300 ms.
- Orden visual = orden lógico: título/nombre → descripción → clasificaciones (selects) → detalles → listas repetibles → acciones.
- **Pantallas de detalle (ver/editar): modo vista por defecto.** Al abrir un registro existente se muestra en solo lectura (un organismo `XView`, como `ProjectView`: textos, `<dl>` para los datos, chips y listas) y los campos solo aparecen tras pulsar **"Editar …"** en el encabezado. "Cancelar" vuelve a la vista sin guardar; guardar bien vuelve a la vista y notifica. Nunca abrir un registro directamente con el formulario editable.
- La vista y el formulario muestran **los mismos datos en el mismo orden**; los valores vacíos dicen "Sin definir" (o un texto propio: "Sin programa asociado"), nunca quedan en blanco.

## 9. Roles y acceso

- Roles: `LIDER`, `COLABORADOR`, `ADMIN` (vienen en `useAuth().user.role`).
- Una página exclusiva de un rol se envuelve en `<RoleGuard roles={["ADMIN"]}>` dentro del `AppShell` (muestra "No tienes permisos para ver esta página."). Esto **no reemplaza** la validación del backend; es para no mostrar pantallas rotas. `ProtectedRoute` solo exige sesión.
- El LIDER también puede tener perfil técnico: todo lo de `/collaborators/me*` debe funcionar para `COLABORADOR` y `LIDER`.

## 10. Textos de la interfaz

- En español, tuteando ("Crea tu perfil", "No tienes permisos") y con tildes y signos correctos (`¿`, `…`).
- Los valores de enums nunca se muestran crudos: se traducen con un mapa `Record<Enum, string>` (`ROLE_LABEL`, niveles "Básico · Intermedio · Avanzado · Experto").
- Terminología del alcance v2.0: *colaborador*, *líder de proyecto*, *perfil técnico*, *habilidades blandas*, *entregables*, *tipo* y *categoría* de proyecto.

## 11. Datos personales (RNF5, Ley 1581)

- Nunca poner datos personales en la URL (query string) ni en `console.log`.
- En `localStorage` solo va la sesión (`auth_token`, `auth_user`), nada más.
- Los datos de prueba (seeds, plantillas Excel, capturas para el documento) son siempre ficticios.

## 12. Buenas prácticas de desarrollo

**Diseño del código**
- **Una responsabilidad por pieza.** Un componente que pasa de ~200 líneas o mezcla varias pantallas (como `ProfileModals` con cinco modales) se divide cuando se vuelva a tocar.
- **Estado derivado, no duplicado.** Lo que se puede calcular a partir de props o estado se calcula al renderizar (como `effectiveTypeId` en `ProjectForm`). No se copia a otro `useState` ni se sincroniza con `useEffect`.
- `useEffect` solo para sincronizar con algo externo (API, `window`, temporizadores) y **siempre con limpieza** (`clearTimeout`, `removeEventListener`, descartar respuestas viejas).
- **No abstraer antes de tiempo:** la tercera repetición justifica un componente o hook compartido; dos parecidas todavía no.
- Nada de números mágicos: medidas en variables CSS, límites del negocio (0–60 horas, 0–600 meses, 5 MB) en constantes con nombre.
- `key` estable en listas: el `id` del backend. Índice solo si la lista no se reordena ni se borra en medio. (`DeliverablesEditor` usa índice y quita filas: pasar a un id local cuando se toque.)
- Componentes definidos **fuera** de otros componentes: uno declarado dentro del render se vuelve a montar en cada render y pierde foco, estado y desplegables abiertos.

**Accesibilidad (RNF1)**
- Todo control tiene una etiqueta visible o un `aria-label` (los botones de solo ícono siempre: "Quitar entregable 2", "Abrir menú").
- Todo se puede usar con teclado: los modales y el menú lateral se cierran con Escape y los botones son `<button>`, nunca un `<div onClick>`. Las filas clicables de una tabla también deben tener un botón o enlace dentro.
- Foco visible (el borde rojo de `:focus` / `:focus-within`) y no quitarlo con `outline: none` sin reemplazo.
- Contraste suficiente: texto gris solo con `--c-muted` / `--c-muted-2` sobre fondo claro, nunca más claro que eso.

**Rendimiento y red (RNF3)**
- Búsquedas mientras se escribe con debounce (300 ms) y descartando respuestas viejas.
- No pedir lo mismo dos veces en una pantalla: los catálogos usan la petición compartida (sección 4); cualquier otro dato que necesiten varios componentes se carga una vez en la página y se pasa por props.
- Nada de llamadas a la API dentro de un bucle; si falta un endpoint en lote, se pide al backend.

**Seguridad**
- Nunca `dangerouslySetInnerHTML` con datos del usuario o del backend.
- Nunca confiar en el rol del front para proteger datos: el front oculta, el backend autoriza.
- Nada de secretos en el código ni en `NEXT_PUBLIC_*` (todo lo `NEXT_PUBLIC_` llega al navegador).

**Limpieza**
- Sin `console.log`, código comentado ni imports sin usar al terminar.
- Un `TODO` solo con contexto: qué falta y en qué iteración (`// TODO(Iter. 2): conectar con /projects/:id/analysis`).
- Cambios acotados a la tarea. Si aparece algo roto fuera del alcance, se anota o se avisa en vez de arreglarlo de paso sin decirlo.

## 13. Antes de dar una tarea por terminada

1. `npx tsc --noEmit` y `npm run build` sin errores.
2. `npm run lint` sin errores (desde el 27/09 el lint queda limpio).
3. Probar en el navegador contra el backend real, con el rol que corresponde, y revisar los cuatro estados de la sección 5 y que cada acción muestre su notificación (éxito, error y confirmación si elimina).
4. **Responsive y tamaños:** revisar en 375, 768, 1024 y 1280 px que no haya desborde horizontal, que los media queries sean mobile-first con los breakpoints de la tabla y que botones y campos usen la escala `size` (secciones 7 y 8).
5. Tests: se escriben para la lógica pura (utilidades, mapeos, validaciones) y para los hooks cuando tengan reglas propias. Para las pantallas no son obligatorios en la Iteración 1.
6. Actualizar `notes/estado-desarrollo.md` si la tarea cambia el estado de la iteración (y copiar la nota a `conecta-u-back/notes/`).
7. Commits en inglés con el prefijo convencional (`feat:`, `fix:`, `refactor:`, `chore:`), solo cuando el usuario lo pida.
