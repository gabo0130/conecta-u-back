import * as bcrypt from 'bcryptjs';
import { In } from 'typeorm';
import type { AvailabilityStatus } from '../../domain/entities/availability-status.type';
import type { ExperienceType } from '../../domain/entities/experience-type.type';
import type { Level } from '../../domain/entities/level.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import type { SkillType } from '../../domain/entities/skill-type.type';
import type { TemplateField } from '../../domain/entities/template-field.type';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import { AppDataSource } from './data-source';
import { CollaboratorOrmEntity } from './typeorm/collaborator.orm-entity';
import { CollaboratorSkillOrmEntity } from './typeorm/collaborator-skill.orm-entity';
import { ExperienceOrmEntity } from './typeorm/experience.orm-entity';
import { ProgramOrmEntity } from './typeorm/program.orm-entity';
import { ProjectCategoryOrmEntity } from './typeorm/project-category.orm-entity';
import { ProjectTypeOrmEntity } from './typeorm/project-type.orm-entity';
import { ProjectOrmEntity } from './typeorm/project.orm-entity';
import { SkillOrmEntity } from './typeorm/skill.orm-entity';
import { UserOrmEntity } from './typeorm/user.orm-entity';

const PASSWORD = 'Test1234!';

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

interface SeedProgram {
  code: string;
  name: string;
  faculty: string;
}

const PROGRAMS: SeedProgram[] = [
  { code: 'ISI', name: 'Ingeniería de Sistemas', faculty: 'Ingeniería' },
  { code: 'IEL', name: 'Ingeniería Electrónica', faculty: 'Ingeniería' },
  { code: 'IIN', name: 'Ingeniería Industrial', faculty: 'Ingeniería' },
  { code: 'DGR', name: 'Diseño Gráfico', faculty: 'Artes' },
  { code: 'EST', name: 'Estadística', faculty: 'Ciencias Básicas' },
];

interface SeedSkill {
  name: string;
  type: SkillType;
  category: SkillCategory;
  synonyms?: string[];
}

const SKILLS: SeedSkill[] = [
  {
    name: 'React',
    type: 'CONOCIMIENTO',
    category: 'FRAMEWORK',
    synonyms: ['reactjs'],
  },
  {
    name: 'Next.js',
    type: 'CONOCIMIENTO',
    category: 'FRAMEWORK',
    synonyms: ['nextjs'],
  },
  {
    name: 'TypeScript',
    type: 'CONOCIMIENTO',
    category: 'LENGUAJE',
    synonyms: ['ts'],
  },
  {
    name: 'JavaScript',
    type: 'CONOCIMIENTO',
    category: 'LENGUAJE',
    synonyms: ['js'],
  },
  {
    name: 'Node.js',
    type: 'CONOCIMIENTO',
    category: 'FRAMEWORK',
    synonyms: ['nodejs'],
  },
  {
    name: 'NestJS',
    type: 'CONOCIMIENTO',
    category: 'FRAMEWORK',
    synonyms: ['nest'],
  },
  {
    name: 'PostgreSQL',
    type: 'CONOCIMIENTO',
    category: 'BASE_DATOS',
    synonyms: ['postgres'],
  },
  { name: 'MySQL', type: 'CONOCIMIENTO', category: 'BASE_DATOS' },
  {
    name: 'MongoDB',
    type: 'CONOCIMIENTO',
    category: 'BASE_DATOS',
    synonyms: ['mongo'],
  },
  { name: 'Docker', type: 'CONOCIMIENTO', category: 'NUBE_DEVOPS' },
  { name: 'AWS', type: 'CONOCIMIENTO', category: 'NUBE_DEVOPS' },
  { name: 'Git', type: 'CONOCIMIENTO', category: 'HERRAMIENTA' },
  { name: 'Figma', type: 'CONOCIMIENTO', category: 'DISENO_UX' },
  { name: 'Prototipado', type: 'CONOCIMIENTO', category: 'DISENO_UX' },
  { name: 'Usabilidad', type: 'CONOCIMIENTO', category: 'DISENO_UX' },
  { name: 'Análisis de datos', type: 'CONOCIMIENTO', category: 'DATOS_IA' },
  { name: 'SQL', type: 'CONOCIMIENTO', category: 'BASE_DATOS' },
  {
    name: 'Power BI',
    type: 'CONOCIMIENTO',
    category: 'DATOS_IA',
    synonyms: ['powerbi'],
  },
  { name: 'Python', type: 'CONOCIMIENTO', category: 'LENGUAJE' },
  { name: 'Java', type: 'CONOCIMIENTO', category: 'LENGUAJE' },
  {
    name: 'Spring Boot',
    type: 'CONOCIMIENTO',
    category: 'FRAMEWORK',
    synonyms: ['springboot'],
  },
  { name: 'IoT', type: 'CONOCIMIENTO', category: 'OTRA' },
  { name: 'Arduino', type: 'CONOCIMIENTO', category: 'HERRAMIENTA' },
  {
    name: 'Excel avanzado',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['excel'],
  },
  { name: 'Lean Manufacturing', type: 'CONOCIMIENTO', category: 'METODOLOGIA' },
  { name: 'HTML', type: 'CONOCIMIENTO', category: 'LENGUAJE' },
  { name: 'CSS', type: 'CONOCIMIENTO', category: 'LENGUAJE' },
  {
    name: 'Tailwind CSS',
    type: 'CONOCIMIENTO',
    category: 'FRAMEWORK',
    synonyms: ['tailwind'],
  },
  { name: 'Scrum', type: 'CONOCIMIENTO', category: 'METODOLOGIA' },
  {
    name: 'Trabajo en equipo',
    type: 'HABILIDAD_BLANDA',
    category: 'TRABAJO_EQUIPO',
  },
  { name: 'Liderazgo', type: 'HABILIDAD_BLANDA', category: 'LIDERAZGO' },
  { name: 'Comunicación', type: 'HABILIDAD_BLANDA', category: 'COMUNICACION' },
  {
    name: 'Resolución de problemas',
    type: 'HABILIDAD_BLANDA',
    category: 'OTRA',
  },
  { name: 'Pensamiento analítico', type: 'HABILIDAD_BLANDA', category: 'OTRA' },
  { name: 'Gestión del tiempo', type: 'HABILIDAD_BLANDA', category: 'GESTION' },
  {
    name: 'Gestión de proyectos',
    type: 'HABILIDAD_BLANDA',
    category: 'GESTION',
  },
  { name: 'Creatividad', type: 'HABILIDAD_BLANDA', category: 'OTRA' },
  { name: 'Adaptabilidad', type: 'HABILIDAD_BLANDA', category: 'OTRA' },
];

interface SeedProjectType {
  code: string;
  name: string;
  templateFields: TemplateField[];
}

const PROJECT_TYPES: SeedProjectType[] = [
  {
    code: 'INVESTIGACION',
    name: 'Investigación / Semillero',
    templateFields: [
      {
        key: 'grupoInvestigacion',
        label: 'Grupo de investigación',
        kind: 'text',
        required: true,
      },
      {
        key: 'lineaInvestigacion',
        label: 'Línea de investigación',
        kind: 'text',
        required: false,
      },
    ],
  },
  {
    code: 'CURSO',
    name: 'Curso',
    templateFields: [
      { key: 'asignatura', label: 'Asignatura', kind: 'text', required: true },
      {
        key: 'docente',
        label: 'Docente responsable',
        kind: 'text',
        required: true,
      },
    ],
  },
  {
    code: 'INTERDISCIPLINARIO',
    name: 'Interdisciplinario',
    templateFields: [
      {
        key: 'programasInvolucrados',
        label: 'Programas involucrados',
        kind: 'text',
        required: true,
      },
    ],
  },
  {
    code: 'EXTENSION',
    name: 'Extensión',
    templateFields: [
      {
        key: 'entidadAliada',
        label: 'Entidad aliada',
        kind: 'text',
        required: true,
      },
    ],
  },
];

const PROJECT_CATEGORIES = [
  'Desarrollo de software',
  'Investigación aplicada',
  'Innovación social',
  'Automatización y control',
  'Analítica de datos',
];

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

const LEADERS = [
  { fullName: 'Laura Méndez', email: 'laura.mendez@conectau.test' },
  { fullName: 'Mario Quintero', email: 'mario.quintero@conectau.test' },
];

interface SeedCollaboratorSkill {
  skillName: string;
  level: Level;
  experienceMonths: number;
  lastUsedYear?: number;
}

interface SeedExperience {
  type: ExperienceType;
  role: string;
  organization: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  weeklyHours: number;
  level: Level;
  description?: string;
  technologies?: string[];
}

interface SeedCollaborator {
  email: string;
  firstName: string;
  lastName: string;
  personType: PersonType;
  programCode: string;
  semester?: number;
  researchGroup?: string;
  summary?: string;
  availabilityStatus: AvailabilityStatus;
  weeklyHours: number;
  skills: SeedCollaboratorSkill[];
  experiences: SeedExperience[];
}

const COLLABORATORS: SeedCollaborator[] = [
  {
    email: 'carlos.contreras@conectau.test',
    firstName: 'Carlos',
    lastName: 'Contreras',
    personType: 'ESTUDIANTE',
    programCode: 'ISI',
    semester: 7,
    researchGroup: 'Semillero de Software · Grupo A',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: 12,
    skills: [
      {
        skillName: 'React',
        level: 'AVANZADO',
        experienceMonths: 24,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Next.js',
        level: 'AVANZADO',
        experienceMonths: 18,
        lastUsedYear: 2026,
      },
      {
        skillName: 'TypeScript',
        level: 'INTERMEDIO',
        experienceMonths: 12,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Figma',
        level: 'BASICO',
        experienceMonths: 6,
        lastUsedYear: 2025,
      },
      {
        skillName: 'Trabajo en equipo',
        level: 'AVANZADO',
        experienceMonths: 24,
      },
    ],
    experiences: [
      {
        type: 'SEMILLERO_INVESTIGACION',
        role: 'Desarrollador Frontend',
        organization: 'Semillero de Software',
        startDate: '2024-01-15',
        current: true,
        weeklyHours: 10,
        level: 'AVANZADO',
        description: 'Módulos de gestión y dashboards con React y Next.js.',
        technologies: ['React', 'Next.js'],
      },
    ],
  },
  {
    email: 'maria.rangel@conectau.test',
    firstName: 'María',
    lastName: 'Rangel',
    personType: 'ESTUDIANTE',
    programCode: 'ISI',
    semester: 8,
    researchGroup: 'Semillero de Datos · Grupo B',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: 10,
    skills: [
      {
        skillName: 'NestJS',
        level: 'AVANZADO',
        experienceMonths: 18,
        lastUsedYear: 2026,
      },
      {
        skillName: 'PostgreSQL',
        level: 'AVANZADO',
        experienceMonths: 18,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Node.js',
        level: 'INTERMEDIO',
        experienceMonths: 14,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Docker',
        level: 'BASICO',
        experienceMonths: 6,
        lastUsedYear: 2025,
      },
      {
        skillName: 'Resolución de problemas',
        level: 'AVANZADO',
        experienceMonths: 18,
      },
    ],
    experiences: [
      {
        type: 'PROYECTO_ACADEMICO',
        role: 'Desarrolladora Backend',
        organization: 'Universidad Francisco de Paula Santander',
        startDate: '2023-02-01',
        endDate: '2023-11-30',
        current: false,
        weeklyHours: 8,
        level: 'INTERMEDIO',
        description: 'Backend con autenticación por roles y PostgreSQL.',
        technologies: ['NestJS', 'PostgreSQL'],
      },
      {
        type: 'SEMILLERO_INVESTIGACION',
        role: 'Auxiliar de base de datos',
        organization: 'Semillero de Datos',
        startDate: '2024-02-01',
        current: true,
        weeklyHours: 8,
        level: 'AVANZADO',
        description: 'Modelado relacional y consultas de optimización.',
        technologies: ['PostgreSQL'],
      },
    ],
  },
  {
    email: 'diego.luna@conectau.test',
    firstName: 'Diego',
    lastName: 'Luna',
    personType: 'ESTUDIANTE',
    programCode: 'DGR',
    semester: 6,
    researchGroup: 'Semillero de Innovación · Grupo C',
    availabilityStatus: 'PARCIAL',
    weeklyHours: 5,
    skills: [
      {
        skillName: 'Figma',
        level: 'AVANZADO',
        experienceMonths: 20,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Usabilidad',
        level: 'INTERMEDIO',
        experienceMonths: 12,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Prototipado',
        level: 'AVANZADO',
        experienceMonths: 18,
        lastUsedYear: 2026,
      },
      { skillName: 'Comunicación', level: 'INTERMEDIO', experienceMonths: 12 },
    ],
    experiences: [
      {
        type: 'SEMILLERO_INVESTIGACION',
        role: 'Diseñador UI/UX',
        organization: 'Semillero de Innovación',
        startDate: '2024-03-01',
        current: true,
        weeklyHours: 5,
        level: 'AVANZADO',
        description: 'Prototipos de alta fidelidad y pruebas de usabilidad.',
        technologies: ['Figma', 'Prototipado'],
      },
    ],
  },
  {
    email: 'sara.ayala@conectau.test',
    firstName: 'Sara',
    lastName: 'Ayala',
    personType: 'ESTUDIANTE',
    programCode: 'EST',
    semester: 9,
    researchGroup: 'Semillero de Datos · Grupo B',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: 10,
    skills: [
      {
        skillName: 'Análisis de datos',
        level: 'AVANZADO',
        experienceMonths: 20,
        lastUsedYear: 2026,
      },
      {
        skillName: 'SQL',
        level: 'INTERMEDIO',
        experienceMonths: 14,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Power BI',
        level: 'INTERMEDIO',
        experienceMonths: 10,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Pensamiento analítico',
        level: 'AVANZADO',
        experienceMonths: 20,
      },
    ],
    experiences: [
      {
        type: 'SEMILLERO_INVESTIGACION',
        role: 'Analista de datos junior',
        organization: 'Semillero de Datos',
        startDate: '2023-08-01',
        current: true,
        weeklyHours: 10,
        level: 'AVANZADO',
        description: 'Tableros de indicadores académicos.',
        technologies: ['SQL', 'Power BI'],
      },
    ],
  },
  {
    email: 'andres.pardo@conectau.test',
    firstName: 'Andrés',
    lastName: 'Pardo',
    personType: 'ESTUDIANTE',
    programCode: 'IEL',
    semester: 7,
    researchGroup: 'Semillero de Investigación · Grupo D',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: 8,
    skills: [
      {
        skillName: 'IoT',
        level: 'AVANZADO',
        experienceMonths: 16,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Arduino',
        level: 'AVANZADO',
        experienceMonths: 16,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Python',
        level: 'INTERMEDIO',
        experienceMonths: 12,
        lastUsedYear: 2026,
      },
      { skillName: 'Liderazgo', level: 'INTERMEDIO', experienceMonths: 12 },
    ],
    experiences: [
      {
        type: 'PROYECTO_ACADEMICO',
        role: 'Investigador auxiliar',
        organization: 'Semillero de Investigación',
        startDate: '2024-01-01',
        endDate: '2024-11-30',
        current: false,
        weeklyHours: 8,
        level: 'AVANZADO',
        description:
          'Prototipo IoT de temperatura y humedad para monitoreo de alimentos.',
        technologies: ['IoT', 'Arduino'],
      },
    ],
  },
  {
    email: 'valentina.ortiz@conectau.test',
    firstName: 'Valentina',
    lastName: 'Ortiz',
    personType: 'ESTUDIANTE',
    programCode: 'ISI',
    semester: 5,
    researchGroup: 'Semillero de Software · Grupo A',
    availabilityStatus: 'NO_DISPONIBLE',
    weeklyHours: 0,
    skills: [
      {
        skillName: 'Java',
        level: 'INTERMEDIO',
        experienceMonths: 10,
        lastUsedYear: 2025,
      },
      {
        skillName: 'Spring Boot',
        level: 'BASICO',
        experienceMonths: 4,
        lastUsedYear: 2025,
      },
      {
        skillName: 'Gestión del tiempo',
        level: 'INTERMEDIO',
        experienceMonths: 10,
      },
    ],
    experiences: [],
  },
  {
    email: 'julian.caceres@conectau.test',
    firstName: 'Julián',
    lastName: 'Cáceres',
    personType: 'ESTUDIANTE',
    programCode: 'IIN',
    semester: 8,
    researchGroup: 'Semillero de Investigación · Grupo D',
    availabilityStatus: 'PARCIAL',
    weeklyHours: 5,
    skills: [
      {
        skillName: 'Gestión de proyectos',
        level: 'INTERMEDIO',
        experienceMonths: 12,
      },
      {
        skillName: 'Excel avanzado',
        level: 'AVANZADO',
        experienceMonths: 18,
        lastUsedYear: 2026,
      },
      {
        skillName: 'Lean Manufacturing',
        level: 'INTERMEDIO',
        experienceMonths: 10,
        lastUsedYear: 2025,
      },
    ],
    experiences: [
      {
        type: 'PRACTICA',
        role: 'Practicante de logística',
        organization: 'Empresa local',
        startDate: '2024-06-01',
        endDate: '2024-12-15',
        current: false,
        weeklyHours: 20,
        level: 'INTERMEDIO',
        description: 'Optimización de inventario y rutas.',
        technologies: ['Excel avanzado'],
      },
    ],
  },
  {
    email: 'camila.rojas@conectau.test',
    firstName: 'Camila',
    lastName: 'Rojas',
    personType: 'ESTUDIANTE',
    programCode: 'ISI',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: 0,
    skills: [],
    experiences: [],
  },
];

interface SeedDeliverable {
  name: string;
  scope: string;
}

interface SeedProject {
  leaderEmail: string;
  title: string;
  summary: string;
  objectives: string;
  typeCode: string;
  categoryName: string;
  programCode?: string;
  typeData: Record<string, unknown>;
  knownSkills: string[];
  deliverables: SeedDeliverable[];
  status: 'BORRADOR' | 'EN_ANALISIS' | 'ANALIZADO';
}

const PROJECTS: SeedProject[] = [
  {
    leaderEmail: 'laura.mendez@conectau.test',
    title: 'SISGELAB — Sistema de gestión de laboratorios',
    summary:
      'Plataforma web para reservar laboratorios y controlar préstamos e inventario con trazabilidad.',
    objectives:
      'Digitalizar reservas, registrar préstamos de equipos y generar reportes de uso para la coordinación.',
    typeCode: 'INVESTIGACION',
    categoryName: 'Desarrollo de software',
    programCode: 'ISI',
    typeData: { grupoInvestigacion: 'Grupo de Investigación GIS' },
    knownSkills: ['React', 'NestJS', 'PostgreSQL'],
    deliverables: [
      { name: 'Módulo de reservas', scope: 'Reserva de laboratorios en línea' },
      {
        name: 'Módulo de inventario',
        scope: 'Registro y trazabilidad de préstamos',
      },
    ],
    status: 'BORRADOR',
  },
  {
    leaderEmail: 'laura.mendez@conectau.test',
    title: 'Reducción de desperdicio de alimentos (IoT)',
    summary:
      'Monitoreo de temperatura y humedad en cafeterías para reducir el desperdicio de alimentos.',
    objectives:
      'Instalar sensores, analizar datos de conservación y proponer alertas tempranas.',
    typeCode: 'INVESTIGACION',
    categoryName: 'Automatización y control',
    programCode: 'IEL',
    typeData: { grupoInvestigacion: 'Semillero de Investigación' },
    knownSkills: ['IoT', 'Arduino', 'Python'],
    deliverables: [
      {
        name: 'Prototipo de sensores',
        scope: 'Sensores de temperatura y humedad',
      },
    ],
    status: 'EN_ANALISIS',
  },
  {
    leaderEmail: 'laura.mendez@conectau.test',
    title: 'Gestión de visitas empresariales',
    summary:
      'Aplicación para programar y documentar visitas empresariales del programa.',
    objectives:
      'Centralizar solicitudes, agendar visitas y registrar evidencias y asistentes.',
    typeCode: 'EXTENSION',
    categoryName: 'Innovación social',
    programCode: 'IIN',
    typeData: { entidadAliada: 'Cámara de Comercio' },
    knownSkills: ['Next.js'],
    deliverables: [
      { name: 'Módulo de agenda', scope: 'Programación de visitas' },
    ],
    status: 'ANALIZADO',
  },
  {
    leaderEmail: 'mario.quintero@conectau.test',
    title: 'Tablero de indicadores académicos',
    summary:
      'Dashboard con indicadores de deserción y desempeño por programa académico.',
    objectives:
      'Consolidar datos institucionales y visualizarlos para apoyar la toma de decisiones.',
    typeCode: 'CURSO',
    categoryName: 'Analítica de datos',
    programCode: 'ISI',
    typeData: {
      asignatura: 'Seminario Integrador III',
      docente: 'Mario Quintero',
    },
    knownSkills: ['SQL', 'Power BI', 'Análisis de datos'],
    deliverables: [{ name: 'Dashboard', scope: 'Indicadores de deserción' }],
    status: 'BORRADOR',
  },
  {
    leaderEmail: 'mario.quintero@conectau.test',
    title: 'Optimización de rutas de transporte universitario',
    summary:
      'Modelo de optimización de rutas para el transporte de estudiantes al campus.',
    objectives:
      'Reducir tiempos de desplazamiento y costos con un modelo de rutas basado en datos.',
    typeCode: 'INTERDISCIPLINARIO',
    categoryName: 'Automatización y control',
    programCode: 'IIN',
    typeData: { programasInvolucrados: 'Ing. Industrial, Ing. de Sistemas' },
    knownSkills: ['Python', 'Lean Manufacturing'],
    deliverables: [
      { name: 'Modelo de rutas', scope: 'Optimización de tiempos' },
    ],
    status: 'BORRADOR',
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SEED_FORCE !== 'true'
  ) {
    throw new Error(
      'Seed bloqueado en producción. Define SEED_FORCE=true si es intencional.',
    );
  }

  await AppDataSource.initialize();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const users = AppDataSource.getRepository(UserOrmEntity);
  const programs = AppDataSource.getRepository(ProgramOrmEntity);
  const skills = AppDataSource.getRepository(SkillOrmEntity);
  const collaborators = AppDataSource.getRepository(CollaboratorOrmEntity);
  const collaboratorSkills = AppDataSource.getRepository(
    CollaboratorSkillOrmEntity,
  );
  const experiences = AppDataSource.getRepository(ExperienceOrmEntity);
  const projectTypes = AppDataSource.getRepository(ProjectTypeOrmEntity);
  const projectCategories = AppDataSource.getRepository(
    ProjectCategoryOrmEntity,
  );
  const projects = AppDataSource.getRepository(ProjectOrmEntity);

  const counters = {
    programs: 0,
    skills: 0,
    projectTypes: 0,
    projectCategories: 0,
    users: 0,
    collaborators: 0,
    projects: 0,
  };

  const seedSkillsFor = async (
    collaboratorId: string,
    list: SeedCollaboratorSkill[],
  ) => {
    for (const item of list) {
      const skillId = skillIdByName.get(item.skillName);
      if (!skillId) continue;
      await collaboratorSkills.save(
        collaboratorSkills.create({
          collaboratorId,
          skillId,
          level: item.level,
          experienceMonths: item.experienceMonths,
          lastUsedYear: item.lastUsedYear ?? null,
        }),
      );
    }
  };

  // Programas
  const programIdByCode = new Map<string, string>();
  for (const program of PROGRAMS) {
    let entity = await programs.findOne({ where: { code: program.code } });
    if (!entity) {
      entity = await programs.save(programs.create(program));
      counters.programs++;
    }
    programIdByCode.set(program.code, entity.id);
  }

  // Catálogo de habilidades
  const skillIdByName = new Map<string, string>();
  for (const skill of SKILLS) {
    const normalizedName = normalizeSkillName(skill.name);
    let entity = await skills.findOne({ where: { normalizedName } });
    if (!entity) {
      entity = await skills.save(
        skills.create({
          name: skill.name,
          normalizedName,
          type: skill.type,
          category: skill.category,
          synonyms: [
            ...new Set((skill.synonyms ?? []).map(normalizeSkillName)),
          ],
          status: 'ACTIVA',
        }),
      );
      counters.skills++;
    }
    skillIdByName.set(skill.name, entity.id);
  }

  // Tipos y categorías de proyecto
  const projectTypeIdByCode = new Map<string, string>();
  for (const type of PROJECT_TYPES) {
    let entity = await projectTypes.findOne({ where: { code: type.code } });
    if (!entity) {
      entity = await projectTypes.save(
        projectTypes.create({
          code: type.code,
          name: type.name,
          templateFields: type.templateFields,
        }),
      );
      counters.projectTypes++;
    }
    projectTypeIdByCode.set(type.code, entity.id);
  }

  const projectCategoryIdByName = new Map<string, string>();
  for (const name of PROJECT_CATEGORIES) {
    let entity = await projectCategories.findOne({ where: { name } });
    if (!entity) {
      entity = await projectCategories.save(projectCategories.create({ name }));
      counters.projectCategories++;
    }
    projectCategoryIdByName.set(name, entity.id);
  }

  // Administrador (desde variables de entorno)
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@conectau.test')
    .trim()
    .toLowerCase();
  const adminPasswordHash = process.env.ADMIN_PASSWORD
    ? await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
    : passwordHash;
  const existingAdmin = await users.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await users.save(
      users.create({
        fullName: 'Administrador',
        email: adminEmail,
        role: 'ADMIN',
        passwordHash: adminPasswordHash,
      }),
    );
    counters.users++;
  }

  const ensureUser = async (
    fullName: string,
    email: string,
    role: 'LIDER' | 'COLABORADOR',
  ) => {
    const existing = await users.findOne({ where: { email } });
    if (existing) return { user: existing, created: false };
    const user = await users.save(
      users.create({ fullName, email, role, passwordHash }),
    );
    return { user, created: true };
  };

  // Líderes
  const leaderIdByEmail = new Map<string, string>();
  for (const leader of LEADERS) {
    const { user, created } = await ensureUser(
      leader.fullName,
      leader.email,
      'LIDER',
    );
    leaderIdByEmail.set(leader.email, user.id);
    if (created) counters.users++;
  }

  // Un líder también puede tener perfil técnico (RF3)
  const lauraId = leaderIdByEmail.get('laura.mendez@conectau.test');
  if (lauraId) {
    const existingProfile = await collaborators.findOne({
      where: { userId: lauraId },
    });
    if (!existingProfile) {
      const laura = await collaborators.save(
        collaborators.create({
          email: 'laura.mendez@conectau.test',
          userId: lauraId,
          firstName: 'Laura',
          lastName: 'Méndez',
          personType: 'DOCENTE',
          programId: programIdByCode.get('ISI'),
          researchGroup: 'Grupo de Investigación GIS',
          summary: 'Docente investigadora, líder de proyectos de software.',
          availabilityStatus: 'DISPONIBLE',
          weeklyHours: 5,
          dataConsent: true,
          dataConsentAt: new Date(),
          source: 'REGISTRO',
        }),
      );
      counters.collaborators++;
      await seedSkillsFor(laura.id, [
        {
          skillName: 'Gestión de proyectos',
          level: 'AVANZADO',
          experienceMonths: 48,
        },
        { skillName: 'Liderazgo', level: 'AVANZADO', experienceMonths: 48 },
      ]);
    }
  }

  // Colaboradores
  for (const data of COLLABORATORS) {
    const { user, created } = await ensureUser(
      `${data.firstName} ${data.lastName}`,
      data.email,
      'COLABORADOR',
    );
    if (!created) continue;
    counters.users++;

    const collaborator = await collaborators.save(
      collaborators.create({
        email: data.email,
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        personType: data.personType,
        programId: programIdByCode.get(data.programCode),
        semester: data.semester ?? null,
        researchGroup: data.researchGroup ?? null,
        summary: data.summary ?? null,
        availabilityStatus: data.availabilityStatus,
        weeklyHours: data.weeklyHours,
        dataConsent: true,
        dataConsentAt: new Date(),
        source: 'REGISTRO',
      }),
    );
    counters.collaborators++;

    await seedSkillsFor(collaborator.id, data.skills);

    for (const experience of data.experiences) {
      const technologyIds = (experience.technologies ?? [])
        .map((name) => skillIdByName.get(name))
        .filter((id): id is string => Boolean(id));
      const technologies = technologyIds.length
        ? await skills.find({ where: { id: In(technologyIds) } })
        : [];

      await experiences.save(
        experiences.create({
          collaboratorId: collaborator.id,
          type: experience.type,
          role: experience.role,
          organization: experience.organization,
          startDate: experience.startDate,
          endDate: experience.endDate ?? null,
          current: experience.current,
          weeklyHours: experience.weeklyHours,
          level: experience.level,
          description: experience.description ?? null,
          technologies,
        }),
      );
    }
  }

  // Proyectos
  for (const project of PROJECTS) {
    const leaderId = leaderIdByEmail.get(project.leaderEmail);
    if (!leaderId) continue;

    const exists = await projects.findOne({
      where: { leaderId, title: project.title },
    });
    if (exists) continue;

    const knownSkillIds = project.knownSkills
      .map((name) => skillIdByName.get(name))
      .filter((id): id is string => Boolean(id));
    const knownSkills = knownSkillIds.length
      ? await skills.find({ where: { id: In(knownSkillIds) } })
      : [];

    await projects.save(
      projects.create({
        leaderId,
        title: project.title,
        summary: project.summary,
        objectives: project.objectives,
        typeId: projectTypeIdByCode.get(project.typeCode),
        categoryId: projectCategoryIdByName.get(project.categoryName),
        programId: project.programCode
          ? programIdByCode.get(project.programCode)
          : null,
        typeData: project.typeData,
        knownSkills,
        deliverables: project.deliverables,
        status: project.status,
      }),
    );
    counters.projects++;
  }

  console.log(
    `Seed completado: ${counters.programs} programas, ${counters.skills} habilidades, ` +
      `${counters.projectTypes} tipos y ${counters.projectCategories} categorías de proyecto, ` +
      `${counters.users} usuarios, ${counters.collaborators} perfiles de colaborador y ` +
      `${counters.projects} proyectos nuevos. Contraseña de todos: ${PASSWORD}`,
  );
  await AppDataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
