# Conecta U — Backend Iteración 1 (Corte Dos) · Instrucciones de implementación

> **Actualizado al modelo v2.0 recortado (25/09/2026).** `Collaborator` se conserva con **id propio** y `userId` **opcional** (colaborador ≠ usuario; un líder también puede tener perfil técnico). Habilidades desde un **catálogo con sinónimos**, **catálogo de programas**, disponibilidad con enum + horas. Formación, certificaciones, idiomas, teléfono, ciudad, días y franja quedan **fuera del PMV**. RF con numeración v2.0 (RF1–RF22). Fuente detallada: *Conecta U — Documento técnico de desarrollo v2.0*.

Guía para construir el backend de la **Iteración 1 (RF1–RF7 y RF19–RF20)** con **NestJS + TypeORM + PostgreSQL**. Pensada para usarse con **Claude Code**: dásela como contexto y pídele que implemente por pasos.

**Stack:** NestJS · TypeORM (code-first) · PostgreSQL · JWT · class-validator · Swagger · ExcelJS.
**Alcance:** autenticación, perfil técnico del colaborador, catálogos (programas, habilidades, tipos y categorías de proyecto), proyectos por tipo e importación de colaboradores desde Excel. **NO** se implementa IA, matchmaking, correo ni dashboard (módulos vacíos).

---

## 0. Reglas

- Fuente de verdad del modelo = entidades TypeORM; tablas por **migraciones**. `synchronize: true` solo en desarrollo.
- Implementar en el orden de la sección 7, compilando entre pasos.
- No crear lógica de IA/matchmaking/estadísticas/correo en esta iteración.

---

## 1. Módulos

| Módulo | Responsabilidad | RF |
|---|---|---|
| `AuthModule` | Registro con vínculo al colaborador, login, JWT, guards y roles | RF1–RF2 |
| `UsersModule` | Cuentas y roles | RF1 |
| `CollaboratorsModule` | Perfil técnico: datos básicos, habilidades, experiencia, disponibilidad | RF3–RF5 |
| `CatalogsModule` | Lectura de programas, habilidades (búsqueda con sinónimos, proponer), tipos y categorías de proyecto | RF3, RF6 |
| `ProjectsModule` | Proyectos por tipo, plantilla dinámica, habilidades conocidas, entregables | RF6–RF7 |
| `ImportModule` | Plantilla Excel de colaboradores | RF19–RF20 |
| `AiModule`, `MatchmakingModule`, `AdminModule`, `DashboardModule`, `MailModule` | Esqueletos vacíos | Iter. 2–3 |

---

## 2. Modelo de datos (entidades TypeORM)

### Enums
```ts
export enum UserRole { LIDER = 'LIDER', COLABORADOR = 'COLABORADOR', ADMIN = 'ADMIN' }
export enum PersonType { ESTUDIANTE = 'ESTUDIANTE', DOCENTE = 'DOCENTE' }
export enum Level { BASICO = 'BASICO', INTERMEDIO = 'INTERMEDIO', AVANZADO = 'AVANZADO', EXPERTO = 'EXPERTO' } // matchmaking: 1–4
export enum SkillType { CONOCIMIENTO = 'CONOCIMIENTO', COMPETENCIA = 'COMPETENCIA', HABILIDAD_BLANDA = 'HABILIDAD_BLANDA' }
export enum SkillCategory { LENGUAJE='LENGUAJE', FRAMEWORK='FRAMEWORK', BASE_DATOS='BASE_DATOS', NUBE_DEVOPS='NUBE_DEVOPS', DATOS_IA='DATOS_IA',
  DISENO_UX='DISENO_UX', HERRAMIENTA='HERRAMIENTA', METODOLOGIA='METODOLOGIA', GESTION='GESTION', COMUNICACION='COMUNICACION',
  TRABAJO_EQUIPO='TRABAJO_EQUIPO', LIDERAZGO='LIDERAZGO', OTRA='OTRA' }
export enum SkillStatus { ACTIVA = 'ACTIVA', PENDIENTE = 'PENDIENTE' }
export enum AvailabilityStatus { DISPONIBLE = 'DISPONIBLE', PARCIAL = 'PARCIAL', NO_DISPONIBLE = 'NO_DISPONIBLE' }
export enum ExperienceType { LABORAL='LABORAL', PRACTICA='PRACTICA', PROYECTO_ACADEMICO='PROYECTO_ACADEMICO',
  SEMILLERO_INVESTIGACION='SEMILLERO_INVESTIGACION', PROYECTO_PERSONAL='PROYECTO_PERSONAL', VOLUNTARIADO='VOLUNTARIADO', DOCENCIA='DOCENCIA' }
export enum CollaboratorSource { REGISTRO = 'REGISTRO', ADMIN = 'ADMIN', IMPORTACION = 'IMPORTACION' }
export enum ProjectStatus { BORRADOR = 'BORRADOR', EN_ANALISIS = 'EN_ANALISIS', ANALIZADO = 'ANALIZADO' }
```
**Niveles:** BÁSICO fundamentos, necesita acompañamiento · INTERMEDIO aplica en proyectos, autónomo en tareas habituales · AVANZADO autónomo en proyectos reales, resuelve problemas complejos · EXPERTO dominio profundo, define buenas prácticas, lidera o enseña.

### User
```ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) passwordHash: string;
  @Column({ length: 120 }) fullName: string;                 // nombre para mostrar (líder/admin)
  @Column({ type: 'enum', enum: UserRole }) role: UserRole;
  @Column({ default: true }) active: boolean;
  @OneToOne(() => Collaborator, (c) => c.user) collaborator?: Collaborator;   // FK vive en collaborators.userId
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

### Program (catálogo, seed)
```ts
@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 20 }) code: string;
  @Column({ length: 120 }) name: string;
  @Column({ length: 120, nullable: true }) faculty: string | null;
  @Column({ default: true }) active: boolean;
}
```

### Collaborator (perfil técnico; con o sin usuario) · RF3, RF5
```ts
@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;                          // llave de la plantilla y destino de convocatorias
  @Column('uuid', { nullable: true, unique: true }) userId: string | null;
  @OneToOne(() => User, (u) => u.collaborator, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' }) user?: User | null;

  @Column({ length: 80 }) firstName: string;
  @Column({ length: 80 }) lastName: string;
  @Column({ type: 'enum', enum: PersonType }) personType: PersonType;
  @ManyToOne(() => Program) @JoinColumn({ name: 'programId' }) program: Program;
  @Column('uuid') programId: string;
  @Column({ type: 'smallint', nullable: true }) semester: number | null;        // solo estudiantes, 1–12
  @Column({ length: 160, nullable: true }) researchGroup: string | null;        // semillero o grupo
  @Column({ type: 'text', nullable: true }) summary: string | null;
  @Column({ nullable: true }) profileUrl: string | null;                         // un enlace: GitHub, portafolio, LinkedIn o CvLAC

  @Column({ type: 'enum', enum: AvailabilityStatus, default: AvailabilityStatus.DISPONIBLE }) availabilityStatus: AvailabilityStatus;
  @Column({ type: 'smallint', default: 0 }) weeklyHours: number;                // 0–60

  @Column({ default: false }) dataConsent: boolean;                              // Ley 1581 de 2012
  @Column({ type: 'timestamptz', nullable: true }) dataConsentAt: Date | null;
  @Column({ type: 'enum', enum: CollaboratorSource, default: CollaboratorSource.REGISTRO }) source: CollaboratorSource;
  @Column({ default: true }) active: boolean;

  @OneToMany(() => CollaboratorSkill, (s) => s.collaborator, { cascade: true }) skills: CollaboratorSkill[];
  @OneToMany(() => Experience, (e) => e.collaborator, { cascade: true }) experiences: Experience[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

### Skill (catálogo) y CollaboratorSkill · RF3
```ts
@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 80 }) name: string;                               // nombre canónico: "React"
  @Column({ length: 80, unique: true }) normalizedName: string;       // "react" (minúsculas, sin tildes ni signos)
  @Column({ type: 'enum', enum: SkillType }) type: SkillType;
  @Column({ type: 'enum', enum: SkillCategory, default: SkillCategory.OTRA }) category: SkillCategory;
  @Column('text', { array: true, default: () => "'{}'" }) synonyms: string[];   // normalizados: ["reactjs","react.js"]
  @Column({ type: 'enum', enum: SkillStatus, default: SkillStatus.ACTIVA }) status: SkillStatus;
}

@Entity('collaborator_skills')
@Unique(['collaboratorId', 'skillId'])
export class CollaboratorSkill {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Collaborator, (c) => c.skills, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'collaboratorId' }) collaborator: Collaborator;
  @Column('uuid') collaboratorId: string;
  @ManyToOne(() => Skill, { eager: true }) @JoinColumn({ name: 'skillId' }) skill: Skill;
  @Column('uuid') skillId: string;
  @Column({ type: 'enum', enum: Level }) level: Level;
  @Column({ type: 'smallint' }) experienceMonths: number;             // 0–600
  @Column({ type: 'smallint', nullable: true }) lastUsedYear: number | null;
}
```
**Búsqueda:** `SkillsService.resolve(text)` normaliza el texto y busca por `normalizedName` o dentro de `synonyms`; si no existe, `propose()` crea la habilidad con `status = PENDIENTE`. El seed trae ~80 habilidades técnicas y blandas con sinónimos.

### Experience y ExperienceSkill · RF4
```ts
@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Collaborator, (c) => c.experiences, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'collaboratorId' }) collaborator: Collaborator;
  @Column('uuid') collaboratorId: string;
  @Column({ type: 'enum', enum: ExperienceType }) type: ExperienceType;
  @Column({ length: 120 }) role: string;
  @Column({ length: 160 }) organization: string;
  @Column({ type: 'date' }) startDate: string;
  @Column({ type: 'date', nullable: true }) endDate: string | null;
  @Column({ default: false }) current: boolean;
  @Column({ type: 'smallint' }) weeklyHours: number;                  // 1–60, dedicación
  @Column({ type: 'enum', enum: Level }) level: Level;                // nivel de desempeño
  @Column({ type: 'text', nullable: true }) description: string | null;
  @ManyToMany(() => Skill) @JoinTable({ name: 'experience_skills', joinColumn: { name: 'experienceId' }, inverseJoinColumn: { name: 'skillId' } })
  technologies: Skill[];
  // durationMonths: se calcula en la respuesta (startDate → endDate | hoy)
}
```

### Catálogos de proyecto, Project, Deliverable · RF6–RF7
```ts
@Entity('project_types')
export class ProjectType {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 40 }) code: string;       // INVESTIGACION | CURSO | INTERDISCIPLINARIO | EXTENSION
  @Column({ length: 80 }) name: string;
  @Column({ type: 'jsonb', default: () => "'[]'" }) templateFields: TemplateField[];
  @Column({ default: true }) active: boolean;
}
// TemplateField = { key; label; kind: 'text'|'textarea'|'number'|'date'|'select'; required: boolean; options?: string[] }

@Entity('project_categories')
export class ProjectCategory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 80 }) name: string;
  @Column({ default: true }) active: boolean;
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 160 }) title: string;
  @Column({ type: 'text' }) summary: string;
  @Column({ type: 'text' }) objectives: string;
  @ManyToOne(() => ProjectType, { eager: true }) @JoinColumn({ name: 'typeId' }) type: ProjectType;
  @Column('uuid') typeId: string;
  @ManyToOne(() => ProjectCategory, { eager: true }) @JoinColumn({ name: 'categoryId' }) category: ProjectCategory;
  @Column('uuid') categoryId: string;
  @ManyToOne(() => Program, { nullable: true }) @JoinColumn({ name: 'programId' }) program?: Program | null;
  @Column('uuid', { nullable: true }) programId: string | null;
  @Column({ type: 'jsonb', default: () => "'{}'" }) typeData: Record<string, unknown>;
  @ManyToMany(() => Skill) @JoinTable({ name: 'project_skills', joinColumn: { name: 'projectId' }, inverseJoinColumn: { name: 'skillId' } })
  knownSkills: Skill[];                                      // técnicas y blandas que el líder ya conoce
  @OneToMany(() => Deliverable, (d) => d.project, { cascade: true }) deliverables: Deliverable[];
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'leaderId' }) leader: User;
  @Column('uuid') leaderId: string;
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.BORRADOR }) status: ProjectStatus;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('deliverables')
export class Deliverable {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Project, (p) => p.deliverables, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'projectId' }) project: Project;
  @Column('uuid') projectId: string;
  @Column({ length: 140 }) name: string;
  @Column({ type: 'text' }) scope: string;
}
```

---

## 3. Autenticación y autorización

- **Registro (RF1):** email único en `users`, hash con argon2, crea `User` (`fullName`, `role`). **Si `role = COLABORADOR`**, en la misma transacción: busca `Collaborator` por `email`; si existe sin usuario → lo **vincula**; si ya tiene usuario → 409; si no existe → lo **crea** (`source = REGISTRO`) con `firstName`, `lastName`, `personType`, `programId`.
- **Perfil técnico del líder:** `POST /collaborators/me` crea un colaborador vinculado a un usuario LIDER que aún no tiene.
- **Login (RF2):** rechaza `active = false`; JWT `{ sub: userId, role }`.
- `JwtAuthGuard` global (salvo `@Public()`), `RolesGuard` + `@Roles()`, `@CurrentUser()`. `CollaboratorsService.getMine(userId)` → 404 si el usuario no tiene perfil.

---

## 4. Endpoints (Iteración 1)

| Método | Ruta | RF | Rol |
|---|---|---|---|
| POST | `/auth/register` | RF1 | público |
| POST | `/auth/login` | RF2 | público |
| POST | `/collaborators/me` | RF3 | LIDER sin perfil |
| GET · PATCH | `/collaborators/me` | RF3 | COLABORADOR, LIDER con perfil |
| GET · POST · PATCH · DELETE | `/collaborators/me/skills[/:id]` | RF3 | ídem |
| POST · PATCH · DELETE | `/collaborators/me/experience[/:id]` | RF4 | ídem (respuesta con `durationMonths`) |
| PATCH | `/collaborators/me/availability` | RF5 | ídem |
| GET | `/catalogs/programs` | RF1, RF3 | público (registro) |
| GET | `/catalogs/skills?q=&type=` | RF3, RF4, RF6 | autenticado |
| POST | `/catalogs/skills` | RF3 | autenticado (queda PENDIENTE) |
| GET | `/catalogs/project-types`, `/catalogs/project-categories` | RF6 | LIDER, ADMIN |
| POST | `/projects` | RF6 | LIDER |
| GET · PATCH | `/projects`, `/projects/:id` | RF7 | LIDER (dueño) |
| GET | `/admin/import/collaborators/template` | RF19 | ADMIN |
| POST | `/admin/import/collaborators` (multipart .xlsx) | RF19–RF20 | ADMIN |
| GET | `/admin/projects`, `/admin/projects/:id` | RF7 (consulta global) | ADMIN — todos los proyectos, sin validar dueño; cada uno con `leader: { id, fullName, email, active, collaboratorId }` |
| GET | `/admin/collaborators`, `/admin/collaborators/:id` | RF17 (lectura, adelantado) | ADMIN — lista: resumen con `user` (cuenta vinculada o `null`), `skillsCount`, `experiencesCount`; detalle: perfil completo + `active`, `dataConsentAt`, `user`, `ledProjects` |

### DTOs
```ts
class RegisterDto { fullName; email; password /* ≥ 8 */; role: 'LIDER' | 'COLABORADOR';
  collaborator?: { firstName; lastName; personType: PersonType; programId; dataConsent?: boolean /* Ley 1581: se guarda con dataConsentAt */ } /* obligatorio si COLABORADOR */ }
class UpdateCollaboratorDto { firstName?; lastName?; programId?; semester?; researchGroup?; summary?; profileUrl?; dataConsent? }
class CollaboratorSkillDto { skillId; level: Level; experienceMonths /* 0–600 */; lastUsedYear? }
class ProposeSkillDto { name; type: SkillType; category: SkillCategory }
class ExperienceDto { type: ExperienceType; role; organization; startDate; endDate?; current; weeklyHours /* 1–60 */; level: Level; skillIds?: string[]; description? }
class AvailabilityDto { availabilityStatus: AvailabilityStatus; weeklyHours /* 0–60 */ }
class CreateProjectDto { title; summary; objectives; typeId; categoryId; programId?; typeData?; knownSkillIds?: string[]; deliverables: { name; scope }[] /* ≥ 1 */ }
```
Validación de plantilla dinámica: `typeData` debe traer todos los `templateFields` con `required: true` y ninguna clave desconocida → si no, 400.

---

## 5. Importación de colaboradores (RF19–RF20)

Plantilla: **Plantilla Carga Colaboradores – Conecta U.xlsx** (hojas Colaboradores, Habilidades, Experiencia; sin fórmulas).

1. Leer con ExcelJS (máx. 5 MB); si faltan hojas o encabezados → rechazar el archivo.
2. Normalizar (trim, correo en minúsculas) y mapear listas a enums (`"Parcial"` → `PARCIAL`, `"Avanzado"` → `AVANZADO`).
3. Resolver catálogos: `programa` por código o nombre en `programs` (no existe → fila rechazada); `habilidad` y `tecnologias` con `SkillsService.resolve` (no existe → crear PENDIENTE + advertencia).
4. Validar Colaboradores: obligatorios, `autoriza_datos = Sí`, correo único en archivo y BD. Validar Habilidades/Experiencia: correo existente y válido.
5. Guardar cada colaborador en su propia transacción (`source = IMPORTACION`, sin usuario).
6. Responder `{ created, rejected: [{ sheet, row, email, reason }], warnings: [...] }`.

---

## 6. Configuración

```
DATABASE_URL=postgresql://user:pass@localhost:5432/conectau
JWT_SECRET=cambia-esto
JWT_EXPIRES_IN=1d
PORT=3001
CORS_ORIGIN=http://localhost:3000
ADMIN_EMAIL=admin@conectau.local
ADMIN_PASSWORD=cambia-esto
```
Transversal: `ValidationPipe` global (`whitelist`, `transform`), filtro de errores `{ statusCode, message, error, timestamp, path }`, Swagger en `/docs`, `passwordHash` nunca serializado, CORS al frontend.

---

## 7. Orden de construcción

1. Base: TypeORM, `ValidationPipe`, filtro, Swagger, CORS.
2. Entidades y primera migración (o migración desde el modelo anterior, sección 9).
3. Seeds: `programs`, `skills` (con sinónimos), `project_types` (con `templateFields`), `project_categories`, usuario ADMIN.
4. Auth (RF1–RF2) con vínculo al colaborador.
5. Catalogs: programas, búsqueda y propuesta de habilidades, tipos y categorías.
6. Collaborators (RF3–RF5).
7. Projects (RF6–RF7).
8. Import (RF19–RF20); probar con la plantilla y 20+ colaboradores ficticios.
9. Swagger + prueba rápida; esqueletos vacíos de Iter. 2–3.

---

## 8. Definición de "hecho"

- Un colaborador se registra (vinculado a su perfil nuevo o importado), inicia sesión y completa su perfil técnico: datos básicos, habilidades del catálogo con nivel y meses, experiencia con dedicación y nivel, y disponibilidad.
- Un líder puede crear su propio perfil técnico.
- Un líder registra un proyecto por tipo, con categoría, habilidades conocidas y al menos un entregable, y consulta/actualiza los suyos.
- El administrador importa la plantilla y ve creados, rechazados y advertencias.

---

## 9. Migración desde el modelo anterior (`Collaborator` con PK = userId)

1. `collaborators`: nuevo `id` uuid como PK; `userId` → nullable + único, FK `ON DELETE SET NULL`.
2. Agregar `programId`, `semester`, `researchGroup`, `summary`, `profileUrl`, `dataConsent`, `dataConsentAt`, `source`, `active`; disponibilidad = `availabilityStatus` + `weeklyHours` (borrar `modality` si existía). Copiar nombre y programa desde `users`; en `users` queda `fullName`.
3. Crear `programs` y el catálogo `skills`; pasar la antigua tabla de habilidades (texto libre) a `collaborator_skills` resolviendo cada nombre en el catálogo.
4. `experiences`: `title`/`period` → `type`, `role`, `startDate`, `endDate`, `current`, `weeklyHours`, `level`; crear `experience_skills`.
5. Crear `project_types`, `project_categories`, `project_skills`, `deliverables`; agregar a `projects` `programId`, `typeId`, `categoryId`, `typeData`.
6. Frontend: rutas `/profiles/me/*` → `/collaborators/me/*`.
7. Revisar la migración generada a mano (cambio de PK). Si la BD solo tiene datos de prueba, recrearla.

**Fuera del PMV:** formación, certificaciones, idiomas, teléfono, ciudad, días y franja de disponibilidad.
