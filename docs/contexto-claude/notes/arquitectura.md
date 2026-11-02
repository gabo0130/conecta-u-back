# Arquitectura — Conecta U (UFPS-CON-001)

> **Actualizado al Alcance Global v2.0 (25/09/2026):** Colaborador ≠ Usuario, catálogos (programas, habilidades, tipos/categorías), importación Excel, dashboard del administrador y correo por SMTP en host local. RF con numeración v2.0 (RF1–RF22).

Diagramas de arquitectura en Mermaid. Stack: **Next.js/React** (frontend), **NestJS/Node.js** (backend, API REST), **PostgreSQL** (con `pgvector` opcional), **IA por API** (Gemini/OpenAI), **motor de matchmaking**, **ExcelJS/SheetJS** (importación) y **Nodemailer + servidor SMTP local** (convocatorias). Sirven para la Fase de Diseño del Documento Ingenieril (2.3 Arquitectura del sistema).

---

## 1. Arquitectura general (vista de contenedores)

```mermaid
flowchart TB
    subgraph Cliente["Cliente (Navegador)"]
        U["Usuarios: Líder / Colaborador / Administrador"]
    end

    subgraph Frontend["Frontend - Next.js / React (Vercel)"]
        UI["Páginas y componentes UI"]
        Dash["Dashboard admin (gráficos)"]
        APIClient["Cliente HTTP + manejo de sesión"]
    end

    subgraph Backend["Backend - NestJS · API REST (Render/Railway)"]
        AuthM["Auth y Usuarios"]
        PeopleM["Colaboradores y perfil técnico"]
        CatM["Catálogos"]
        ProyM["Proyectos"]
        IAM["IA"]
        MatchM["Matchmaking"]
        ImpM["Importación Excel"]
        AdminM["Administración y Dashboard"]
        MailM["Correo / Convocatorias"]
    end

    DB[("PostgreSQL - pgvector opcional")]
    IA["API de IA - Gemini / OpenAI"]
    SMTP["Servidor SMTP (host local)"]

    U --> UI
    UI --> Dash
    UI --> APIClient
    APIClient -->|"HTTPS / JWT"| Backend
    AuthM --> DB
    PeopleM --> DB
    CatM --> DB
    ProyM --> DB
    ImpM --> DB
    AdminM --> DB
    MatchM --> DB
    MailM --> DB
    IAM -->|"descripción + objetivos"| IA
    IA -->|"perfiles + justificación"| IAM
    IAM --> MatchM
    MailM -->|"SMTP"| SMTP
```

---

## 2. Arquitectura en capas (patrón MVC / NestJS)

```mermaid
flowchart TB
    subgraph Pres["Capa de Presentación"]
        Ctrl["Controllers (endpoints REST)"]
        DTO["DTOs + Validación"]
        Guards["Guards / Interceptors (Auth, Roles)"]
    end

    subgraph Neg["Capa de Lógica de Negocio"]
        Serv["Services (reglas de negocio)"]
        IAserv["AI Service"]
        MatchServ["Matchmaking Service"]
        ImpServ["Import Service (Excel)"]
        MailServ["Mail Service (Nodemailer)"]
    end

    subgraph Acc["Capa de Acceso a Datos"]
        Repo["Repositories (TypeORM)"]
        Ent["Entities: User, Collaborator, Program, Skill, CollaboratorSkill, Experience, ExperienceSkill, Project, ProjectType, ProjectCategory, ProjectSkill, Deliverable"]
    end

    DB[("PostgreSQL")]
    Ext["API IA externa"]
    SMTP["SMTP local"]

    Ctrl --> Serv
    DTO --> Ctrl
    Guards --> Ctrl
    Serv --> Repo
    Serv --> IAserv
    Serv --> MatchServ
    Serv --> ImpServ
    Serv --> MailServ
    IAserv --> Ext
    MailServ --> SMTP
    Repo --> Ent
    Ent --> DB
```

---

## 3. Módulos por dominio y por iteración

```mermaid
flowchart LR
    subgraph It1["Iteración 1 · Base funcional (Corte Dos)"]
        M1["Auth y Usuarios · RF1-RF2"]
        M2["Colaboradores: perfil técnico (habilidades con nivel, experiencia, disponibilidad) · RF3-RF5"]
        M3["Proyectos por tipo, categoría y entregables · RF6-RF7"]
        M8["Importación de colaboradores (Excel) · RF19-RF20"]
    end

    subgraph It2["Iteración 2 · Innovación (Corte Tres)"]
        M4["IA: análisis y perfiles · RF8-RF10"]
        M5["Matchmaking y recomendación · RF11-RF13"]
    end

    subgraph It3["Iteración 3 · Consolidación (Examen)"]
        M6["Gestión de usuarios, colaboradores y catálogos · RF14, RF17, RF18"]
        M7["Dashboard, estadísticas y reportes · RF15-RF16"]
        M9["Convocatoria por correo · RF21-RF22"]
    end

    M3 --> M4
    M2 --> M5
    M4 --> M5
    M8 --> M5
    M1 --> M6
    M5 --> M9
```

---

## 4. Arquitectura de despliegue

```mermaid
flowchart TB
    Dev["Repositorio - GitHub"]
    User["Usuario (HTTPS)"]

    subgraph VercelC["Vercel"]
        FE["Frontend Next.js"]
    end

    subgraph RenderC["Render / Railway"]
        BE["Backend NestJS - API REST"]
        DB[("PostgreSQL gestionado")]
    end

    subgraph Local["Host local"]
        SMTP["Servidor SMTP (Postfix / Mailpit en desarrollo)"]
    end

    IA["API IA - Gemini / OpenAI"]

    Dev -->|"CI/CD"| FE
    Dev -->|"CI/CD"| BE
    User -->|HTTPS| FE
    FE -->|"REST / HTTPS"| BE
    BE --> DB
    BE -->|HTTPS| IA
    BE -->|"SMTP (requiere acceso de red al host)"| SMTP
```

> RT14: si el backend está en la nube, el servidor SMTP del host local debe ser alcanzable desde él (o, para la demo, correr backend y SMTP en el mismo equipo).

---

## 5. Flujo del núcleo IA + matchmaking + convocatoria (secuencia)

```mermaid
sequenceDiagram
    actor Lider as Líder de Proyecto
    participant FE as Frontend (Next.js)
    participant BE as Backend (NestJS)
    participant IA as API IA (Gemini/OpenAI)
    participant DB as PostgreSQL
    participant SMTP as SMTP local

    Lider->>FE: Registra proyecto (tipo, categoría, entregables) y solicita análisis
    FE->>BE: POST /projects/{id}/analyze
    BE->>DB: Obtiene datos del proyecto
    BE->>IA: Envía descripción + objetivos + entregables
    IA-->>BE: Perfiles requeridos (técnicos y blandos) + justificación
    BE->>DB: Guarda perfiles identificados
    BE->>DB: Consulta colaboradores (con o sin usuario)
    BE->>BE: Matchmaking (similitud + reglas)
    BE-->>FE: Colaboradores recomendados + justificación
    FE-->>Lider: Muestra recomendaciones (apoyo a la decisión)
    Lider->>FE: Selecciona colaboradores y envía convocatoria
    FE->>BE: POST /projects/{id}/invitations
    BE->>SMTP: Envía correos
    BE->>DB: Registra historial y estado de cada envío
```

---

## 6. Arquitectura del frontend (Next.js)

```mermaid
flowchart TB
    subgraph Next["Frontend - Next.js"]
        Pages["Páginas / Rutas"]
        Comp["Componentes UI reutilizables"]
        Forms["Formulario dinámico por tipo de proyecto"]
        Charts["Gráficos del dashboard"]
        Hooks["Hooks / Estado"]
        Services["Servicios API (fetch/axios)"]
        Auth["Sesión / token JWT"]
    end

    API["Backend NestJS"]

    Pages --> Comp
    Pages --> Forms
    Pages --> Charts
    Pages --> Hooks
    Hooks --> Services
    Services --> Auth
    Services -->|"REST / HTTPS"| API
```

---

### Notas
- **Colaborador ≠ Usuario:** `collaborators.userId` es opcional y único; el matchmaking y las convocatorias trabajan sobre colaboradores.
- **RT11:** si el matchmaking necesita búsqueda semántica, se evalúa PostgreSQL + `pgvector` antes de agregar otra base de datos.
- **RT8:** claves API, credenciales y parámetros SMTP por variables de entorno.
- Las recomendaciones de la IA son **apoyo a la decisión**: el líder decide a quién convocar.
- Para la Entrega 2 (Iteración 1) aplican solo los módulos It1 de la sección 3.
