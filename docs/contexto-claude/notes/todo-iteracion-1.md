# Checklist — Entrega 2 · Conecta U
### Corte Dos (Iteración 1) — Base Funcional del PMV · RF1–RF7 + RF19–RF20 · entrega 09/10/2026
_Actualizado: 25 sep 2026 (alcance v2.0)_

**Entregable central:** Documento Ingenieril (FP-15) de la Iteración 1 + PMV funcionando + soportes (actas, pruebas, cronograma, presentación).

**RF de este corte (numeración v2.0):** RF1 registro/roles + vínculo con el colaborador · RF2 login · RF3 perfil técnico · RF3 conocimientos, competencias y **habilidades blandas** · RF4 experiencia · RF5 disponibilidad · RF6 registro de proyecto con plantilla **por tipo** · RF6 campos del proyecto · RF6 **tipo y categoría** · RF6 **entregables** · RF7 consulta/actualización de proyectos · RF19–RF20 **importación de colaboradores desde Excel** (plantilla de perfil técnico).

RF3–RF5 cubren el **perfil técnico recortado**: datos básicos, habilidades del catálogo con nivel (Básico–Experto) y meses, experiencia con dedicación y nivel, disponibilidad (estado + horas). Modelo: `Collaborator` con `userId` opcional + catálogos `skills` y `programs`.

**Leyenda:** `[x]` hecho · `[~]` en curso / definido, falta plasmarlo · `[ ]` pendiente.

---

## 0. Cierre del ajuste de alcance v2.0 (antes de seguir)
- [x] Planificación Alcance Global v2.0 (HU-01…HU-18, RF1–RF22 consecutivos, priorización según tabla, EDT y costos coherentes).
- [x] Cronograma v2.0 (MS Project XML) con códigos de la EDT y costo = $10.547.550.
- [ ] **Firmar Acta de Reunión No. 2** (llenar fecha, hora, hora de llegada) con la Dra. Judith.
- [ ] **Firmar Acta de Aprobación de RF v2.0** con la Dra. Judith.
- [ ] Subir a la carpeta *Entrega 1* de Drive: Alcance v2.0, actas, cronograma (abrir el .xml en Project → guardar como .mpp y subirlo como **nueva versión** del .mpp para conservar el enlace del documento), FP5 y presentación.
- [x] Plantilla de carga de colaboradores (Excel) definida.
- [ ] Llenar la plantilla con datos de prueba ficticios (≥ 20 personas) para probar la importación y luego el matchmaking.
- [ ] Confirmar con la docente la priorización de las HU cuya combinación Valor/Costo/Riesgo no está en la tabla (HU-02, 05, 08, 09, 10, 11, 12, 13, 17).

---

## ✅ Avance a la fecha
- [x] Contexto de desarrollo, alcance, stack y definiciones (doc del proyecto, v2.0).
- [x] Arquitectura MVC — diagramas Mermaid (actualizados a v2.0).
- [x] Diseño — mockups del recorrido (Claude Design, rojo/blanco UFPS). ⚠️ Falta reflejar: tipo/categoría/entregables en el formulario de proyecto y habilidades blandas en el perfil.
- [x] Frontend base — React/Next.js + CSS Modules. 🔧 en desarrollo.
- [x] Instrucciones de backend Iteración 1 (modelo **Collaborator con userId opcional**, catálogos de habilidades y programas, entregables).

---

## 1. Documento Ingenieril (FP-15) — Fase de Análisis
- [ ] Encabezado del documento (Logo, Nombre, Identificación, Fecha, Versión).
- [~] **1.1 Actores del sistema** — Líder, Colaborador (con usuario, vinculado a una persona), Administrador.
- [~] **1.2 Historias de Usuario** HU-01…HU-07 y HU-17 (versión v2.0).
- [~] **1.3 Requerimientos Funcionales** RF1–RF7, RF19–RF20.
- [ ] **1.4 Descripción de cada RF (RF1–RF7, RF19–RF20)** — tabla por RF con flujo normal/alterno, pre/postcondición. **(pendiente clave)**
- [~] **1.5 Interfaces (GUI)** — entregar en Figma (incluir formulario por tipo de proyecto, perfil técnico por pestañas y pantalla de importación Excel del admin).

## 2. Documento Ingenieril (FP-15) — Fase de Diseño
- [~] **2.1 Modelo lógico / ERD** — con `collaborators` (userId opcional) separado de `users`, `programs`, `skills` (catálogo), `collaborator_skills` (nivel, meses), `experiences` (dedicación, nivel), `experience_skills`, `project_types`, `project_categories`, `deliverables`.
- [ ] **2.2 Diagrama de clases** de la iteración.
- [x] **2.3 Arquitectura del sistema (MVC).**

## 3. Documento Ingenieril (FP-15) — Fase de Desarrollo
- [~] **PMV funcionando** RF1–RF7.
- [ ] **3.1 Implementación** — URL del repositorio, claves/contraseñas y datos de conexión a la BD.

## 4. Documento Ingenieril (FP-15) — Fase de Pruebas
- [ ] **Planeación** de pruebas RF1–RF7.
- [ ] **Ejecución** con la cliente (tarea 1.4.4 del cronograma, 09/10/2026).
- [ ] **Firma de la cliente** por cada funcionalidad probada.
- [ ] **Evidencia** de cada prueba.

## 5. Usuarios y contraseñas
- [ ] URL de acceso y usuarios/contraseñas **por actor**.

## 6. Soportes y Actas
- [ ] **Acta de Reunión (FP2) No. 3** — pruebas de aceptación de la Iteración 1.
- [x] **Cronograma v2.0** (MS Project).
- [x] **Informe de Desempeño (FP5)** — completado el promedio del Líder Tecnológico (4.8).

## 7. Presentación / Sustentación
- [~] `Conecta U v2.0.pptx` — diapositivas de alcance y plan actualizadas; falta preparar la demo del Corte Dos.

---

## Orden de trabajo restante sugerido
1. Firmar actas v2.0 y subir archivos a Drive.
2. **Modelo de datos (ERD) + diagrama de clases** con Collaborator/User (userId opcional).
3. Descripción detallada de RF1–RF7.
4. Desarrollo del PMV (frontend + backend).
5. GUI en Figma.
6. Pruebas de aceptación con la cliente + Acta No. 3 (09/10/2026).
