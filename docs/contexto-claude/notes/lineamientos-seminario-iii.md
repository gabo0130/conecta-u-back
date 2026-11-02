# Lineamientos y Formatos — Seminario Integrador III (Proyecto Conecta U)

Instrucciones para producir cualquier entregable del proyecto Conecta U según los formatos oficiales de Seminario Integrador III (Ingeniería de Sistemas, Universidad Francisco de Paula Santander — UFPS). Cuando se pida redactar, revisar o completar un documento del proyecto, seguir estas reglas y estructuras.

## Contexto general

El equipo actúa como una **Empresa de Base Tecnológica (Empresa TI)** que desarrolla software para un **cliente real**. El trabajo se organiza por **iteraciones** y cada entregable debe ser coherente con el ciclo de vida del producto software.

**Roles del proyecto:**
- Lado Empresa TI: **Gerente del Proyecto**, **Líder Tecnológico (Líder de TI)** y **Desarrolladores** (uno de ellos suele ser Documentador).
- Lado cliente/stakeholders: **Patrocinador**, **Ejecutor**, **Cliente** y **Usuarios**.

**Estructura de iteraciones (obligatoria):** el proyecto se entrega en **TRES iteraciones**:
1. **Corte Dos** — entrega del PMV (Producto Mínimo Viable) con la innovación.
2. **Corte Tres** — entrega del PMV con la innovación.
3. **Corte Examen** — se reservan los RF relacionados con estadísticas dinámicas y reportes, según las necesidades de los usuarios.

Cada iteración es un bloque de tiempo corto y fijo que produce un **incremento funcional entregable** al cliente. Cada iteración requiere un **Acta de Reunión** que soporte la aprobación de los RF definidos.

## Encabezado y pie estándar de los formatos

Casi todos los formatos comparten un encabezado en tabla con: **Logo de la Empresa TI**, **Nombre del Proyecto**, **Identificación** (código del formato, p. ej. `AG1`, `FP2-ActaReunion`, `FP5-001`), **Fecha de emisión** (DD/MM/AAAA) y **Versión** (ej. 1.0). El pie incluye: **Elaborado por** (nombres), **Aprobado por** (nombre + fecha) y **Formato elaborado por** (autoría del formato). Mantener estos campos en cada documento.

---

## 1. Planificación de Alcance Global (AG1)

Documento de planeación inicial del proyecto. Debe contener, en orden:

1. **Descripción del contexto del problema.**
2. **Identificación de los stakeholders** (Patrocinador, Ejecutor, Cliente, Usuarios, según el contexto), siguiendo buenas prácticas de administración de proyectos.
3. **Actores del sistema:** cada persona que ingresará a usar algún servicio del software, con su descripción.
4. **Historias de Usuario** (ver formato en §2). Deben tener evidencia de **Acta de Reunión con el actor** para dar peso a la información registrada.
5. **Requerimientos Funcionales (RF):** refinados por Historia; cada RF con **ID consecutivo único**. De una HU se pueden identificar varios RF.
6. **Requerimientos No Funcionales (RNF):** garantizan usabilidad, fiabilidad y eficiencia del sistema.
7. **Requerimientos Técnicos:** para el despliegue del software (para que el cliente conozca los costos en que va a incurrir). Si se integran tecnologías como IoT, ChatBots con IA, realidad aumentada, drones, etc., establecer sus requerimientos técnicos dentro del PMV.
8. **Plan de Iteraciones:** definir número de iteraciones y las HU/RF a desarrollar en cada una (usar la plantilla de tabla Iteración–HU–RF). Solo se listan **RF ya refinados y funcionales** (los que exigen esfuerzo e interacción del usuario o una acción directa del sistema; las validaciones internas no cuentan como RF). Requiere **Acta de aprobación de los RF** con el cliente.
9. **EDT del proyecto** (estructura de desglose del trabajo), según buenas prácticas de administración de proyectos.
10. **Cronograma:** configuración del proyecto y EDT; la programación de actividades, tiempos y recursos se hace **por iteración**. Para esta entrega solo se programa la **Iteración 1**; las siguientes se entregan en **MS Project**.
11. **Costo del proyecto.**

---

## 2. Historias de Usuario (HU)

Estructura del formato:

- **Código/Nombre del proyecto:** código y nombre que identifican el proyecto.
- **Número/Nombre HU:** el número identifica la HU; el nombre resume la funcionalidad.
- **Rol/Actor:** rol que desempeña el usuario al usar la funcionalidad (lo más específico posible).
- **Factores de priorización** (escala 1 baja, 3 media, 5 alta):
  - **Valor** — importancia para el cliente o negocio: B baja, M mediana, A máxima.
  - **Costo** — costo estimado de desarrollo: B bajo, M mediano, A alto.
  - **Riesgo** — riesgos que impedirían el desarrollo, definidos por el equipo: A alto, M mediano, B bajo.
- **Valor de priorización:** se determina con la tabla de priorización ponderada (abajo).
- **Descripción:** con la estructura *"Como (Actor) quiero (funcionalidad) que (beneficio)."* (Cohn, 2004). Usar "necesita" para acciones obligatorias y "puede" para opcionales.
- **Criterios de Aceptación:** detallan cómo debe comportarse el sistema para cumplir la HU.

**Tabla de priorización ponderada:**

| Valor | Costo | Riesgo | Valor priorización ponderada |
|-------|-------|--------|------------------------------|
| B | B | A | 1 |
| B | M | M | 5 |
| B | A | B | 3 |
| M | B | A | 1 |
| M | M | M | 3 |
| M | A | B | 5 |
| A | B | A | 1 |
| A | M | M | 5 |
| A | A | B | 3 |

Roles que intervienen: líder de proyecto, cliente, usuario.

---

## 3. Requerimientos Funcionales (RF)

Cada RF se describe en una tabla con:

- **Código:** `RFx` (ID consecutivo único).
- **Actores que utilizan el RFx.**
- **Nombre del RF:** igual al definido en la tabla superior de RF.
- **Descripción:** breve, el "qué" del requerimiento.
- **Precondición:** condiciones que deben cumplirse para iniciar el RF.
- **Flujo Normal:** pasos en orden en dos columnas — **Actor** (cómo interviene) y **Sistema** (cómo responde).
- **Flujo Alterno:** comportamiento ante un evento adverso o excepción (Actor / Sistema).
- **Postcondición:** estado en que queda el sistema tras ejecutar el RF.

**Regla clave:** un RF representa un servicio que exige interacción del usuario o una acción directa del sistema. Las validaciones internas (p. ej. "el sistema valida la autenticidad del usuario") **no** son RF: forman parte del flujo del RF principal.

---

## 4. Documento Ingenieril (FP-15)

Documento central del desarrollo. **Debe ser coherente con las actividades del ciclo de vida del producto** y se organiza **por cada iteración**. Informar a la docente ante cualquier cambio. Estructura:

**1. Fase de Análisis**
- 1.1 Actores del sistema (tabla Nombre del actor / Descripción).
- 1.2 Historias de Usuario relacionadas con la iteración que se entrega (por tipo de actor o por proceso).
- 1.3 Requerimientos Funcionales de las HU de la iteración.
- 1.4 Descripción de los RF (una tabla por RF, ver §3).
- 1.5 Interfaces Gráficas (GUI) de la iteración — **entregar en Figma**.

**2. Fase de Diseño**
- 2.1 Modelo lógico de la base de datos de la iteración.
- 2.2 Diagrama de clases de la iteración.
- 2.3 Arquitectura del sistema (**MVC**).

**3. Fase de Desarrollo**
- 3.1 Implementación: referenciar la **URL del código**; claves y contraseñas de acceso (incluida la BD).

**4. Fase de Pruebas**
- 4.1 Pruebas de aceptación por el cliente: el cliente prueba cada funcionalidad y **firma** que realizó las pruebas, según los criterios de aceptación. Distinguir **planeación** (información general, datos de entrada, criterios de aceptación, resultado esperado, fechas de planeación) de **ejecución** (fechas de ejecución, quién ejecutó, quién validó, resultado obtenido, observaciones). Esta etapa siempre lleva **Acta de Reunión**.

**5. Usuarios y contraseñas para ingresar a la aplicación:** URL de acceso y, por actor, usuarios y contraseñas.

---

## 5. Acta de Reunión (FP2-ActaReunion)

Se levanta un acta para: levantamiento de HU con el actor, aprobación de los RF del plan de iteraciones y las pruebas de aceptación de cada iteración. Estructura:

- **Acta No.** (número consecutivo).
- **Generalidades:** Fecha, Hora, Lugar.
- **Asunto** de la reunión.
- **Participantes:** Nombres / Rol / Hora de llegada.
- **Invitados** y **Ausentes** (cuando aplique).
- **Agenda:** lista de actividades.
- **Desarrollo de la reunión:** detalle de cada actividad y lo expuesto por cada participante.
- **Evidencias o Anexos** (audio, video, imágenes, enlaces).
- **Compromisos.**
- **Aprobación del Acta:** Asistentes / Firma.

---

## 6. Pruebas de Aceptación

Por cada caso de prueba (asociado a un RF y su vista):

- **ID del RF** y **Nombre del RF.**
- **Contexto** de la prueba y **Descripción** de la prueba.
- **Planeado por**, **Ejecutado por** (el **cliente**), **Verificado por.**
- **Estado de la prueba:** Pass / Fail.
- **Fechas:** inicio y fin de planeación; inicio y fin de ejecución.
- **Tabla de resultados:** Datos de Entrada / Criterios de Aceptación / Resultado Esperado / Resultado Obtenido.
- **Observaciones** entregadas por el cliente.
- **Evidencia:** imagen o enlace a video de la prueba realizada por el cliente.

Las pruebas se realizan en reunión con el cliente y quedan soportadas en un Acta de Reunión (§5).

---

## 7. Informe de Desempeño (FP5)

Evaluación cruzada del desempeño: del **Gerente y Líder Tecnológico al equipo**, y del **equipo al Gerente** y **al Líder Tecnológico**. Se evalúa por persona en estos criterios:

- Desempeño
- Responsabilidad
- Trabajo en equipo
- Resolución de conflictos
- Conocimientos técnicos

Escala cualitativa por criterio: **Ex** (Excelente), **B** (Bueno), **R** (Regular), **D** (Deficiente), más una **calificación cuantitativa de 0 a 5**. Se saca el **promedio de la nota final** obtenida por el Gerente y por el Líder Tecnológico (indicando el nombre). Incluir fecha de elaboración y "Elaborado por".

---

## 8. Carta de Certificación del Cliente

Constancia firmada por el cliente al recibir el producto. Debe incluir:

- Nombre y logo de la empresa cliente, NIT y cargo de quien firma.
- Encabezado **"HACE CONSTAR"**.
- Declaración de que se recibió el producto (título), desarrollado para la empresa con determinada finalidad, por los estudiantes (código y nombres) del **Programa de Ingeniería de Sistemas de la UFPS**, asignatura **Seminario Integrador III, Grupo X**.
- Declaración de la **calidad, pertinencia e impacto** de la solución presentada.
- Cierre de agradecimiento, firma, nombre, cargo, correo y teléfono de la persona de la empresa.
- Dirección y teléfono de la empresa.

---

## Reglas transversales

- Respetar siempre los **códigos de identificación** y la **versión** de cada formato en el encabezado.
- El **Documento Ingenieril** se actualiza por iteración y debe mantenerse coherente con el cronograma y el ciclo de vida.
- **GUI en Figma**; **cronograma de iteraciones 2 y 3 en MS Project**.
- Cada RF con **ID único consecutivo**; una HU puede generar varios RF.
- Toda información levantada con actores o clientes (HU, aprobación de RF, pruebas) debe estar respaldada por un **Acta de Reunión**.
- Si se usa una plantilla externa distinta a las oficiales, **citar la fuente**.
