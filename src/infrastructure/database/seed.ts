import * as bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { CollaboratorOrmEntity } from './typeorm/collaborator.orm-entity';
import { ProjectOrmEntity } from './typeorm/project.orm-entity';
import { UserOrmEntity } from './typeorm/user.orm-entity';

const PASSWORD = 'Test1234!';

interface SeedCollaborator {
  fullName: string;
  email: string;
  program: string;
  headline: string;
  studyGroup: string;
  availabilityStatus: 'DISPONIBLE' | 'PARCIAL' | 'NO_DISPONIBLE';
  weeklyHours: string;
  modality: string;
  skills: {
    name: string;
    type: 'CONOCIMIENTO' | 'COMPETENCIA';
    level?: string;
  }[];
  experiences: {
    title: string;
    organization: string;
    period: string;
    description: string;
  }[];
}

interface SeedProject {
  leaderEmail: string;
  title: string;
  summary: string;
  objectives: string;
  knownSkills: string[];
  semillero: string;
  program: string;
  status: 'BORRADOR' | 'EN_ANALISIS' | 'ANALIZADO';
}

const LEADERS = [
  {
    fullName: 'Laura Méndez',
    email: 'laura.mendez@conectau.test',
    program: 'Ing. de Sistemas',
  },
  {
    fullName: 'Mario Quintero',
    email: 'mario.quintero@conectau.test',
    program: 'Ing. Industrial',
  },
];

const COLLABORATORS: SeedCollaborator[] = [
  {
    fullName: 'Carlos Contreras',
    email: 'carlos.contreras@conectau.test',
    program: 'Ing. de Sistemas',
    headline: 'Estudiante de Ingeniería de Sistemas',
    studyGroup: 'Semillero de Software · Grupo A',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: '10–15 horas',
    modality: 'Presencial / Remoto',
    skills: [
      { name: 'React', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'Next.js', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'TypeScript', type: 'CONOCIMIENTO', level: 'Intermedio' },
      { name: 'Figma', type: 'CONOCIMIENTO', level: 'Básico' },
      { name: 'Trabajo en equipo', type: 'COMPETENCIA' },
    ],
    experiences: [
      {
        title: 'Desarrollador Frontend',
        organization: 'Semillero de Software',
        period: '2024 – actual',
        description: 'Módulos de gestión y dashboards con React y Next.js.',
      },
    ],
  },
  {
    fullName: 'María Rangel',
    email: 'maria.rangel@conectau.test',
    program: 'Ing. de Sistemas',
    headline: 'Estudiante de Ingeniería de Sistemas',
    studyGroup: 'Semillero de Datos · Grupo B',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: '8–12 horas',
    modality: 'Remoto',
    skills: [
      { name: 'NestJS', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'PostgreSQL', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'Node.js', type: 'CONOCIMIENTO', level: 'Intermedio' },
      { name: 'Docker', type: 'CONOCIMIENTO', level: 'Básico' },
      { name: 'Resolución de problemas', type: 'COMPETENCIA' },
    ],
    experiences: [
      {
        title: 'Proyecto de aula — API REST con NestJS',
        organization: 'Universidad Francisco de Paula Santander',
        period: '2023',
        description: 'Backend con autenticación por roles y PostgreSQL.',
      },
      {
        title: 'Auxiliar de base de datos',
        organization: 'Semillero de Datos',
        period: '2024',
        description: 'Modelado relacional y consultas de optimización.',
      },
    ],
  },
  {
    fullName: 'Diego Luna',
    email: 'diego.luna@conectau.test',
    program: 'Diseño Gráfico',
    headline: 'Estudiante de Diseño Gráfico',
    studyGroup: 'Semillero de Innovación · Grupo C',
    availabilityStatus: 'PARCIAL',
    weeklyHours: '4–6 horas',
    modality: 'Presencial',
    skills: [
      { name: 'Figma', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'Usabilidad', type: 'CONOCIMIENTO', level: 'Intermedio' },
      { name: 'Prototipado', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'Comunicación', type: 'COMPETENCIA' },
    ],
    experiences: [
      {
        title: 'Diseñador UI/UX',
        organization: 'Semillero de Innovación',
        period: '2024 – actual',
        description: 'Prototipos de alta fidelidad y pruebas de usabilidad.',
      },
    ],
  },
  {
    fullName: 'Sara Ayala',
    email: 'sara.ayala@conectau.test',
    program: 'Estadística',
    headline: 'Estudiante de Estadística',
    studyGroup: 'Semillero de Datos · Grupo B',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: '10 horas',
    modality: 'Remoto',
    skills: [
      { name: 'Análisis de datos', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'SQL', type: 'CONOCIMIENTO', level: 'Intermedio' },
      { name: 'Power BI', type: 'CONOCIMIENTO', level: 'Intermedio' },
      { name: 'Pensamiento analítico', type: 'COMPETENCIA' },
    ],
    experiences: [
      {
        title: 'Analista de datos junior',
        organization: 'Semillero de Datos',
        period: '2023 – actual',
        description: 'Tableros de indicadores académicos.',
      },
    ],
  },
  {
    fullName: 'Andrés Pardo',
    email: 'andres.pardo@conectau.test',
    program: 'Ing. Electrónica',
    headline: 'Estudiante de Ingeniería Electrónica',
    studyGroup: 'Semillero de Investigación · Grupo D',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: '6–10 horas',
    modality: 'Presencial',
    skills: [
      { name: 'IoT', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'Arduino', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'Python', type: 'CONOCIMIENTO', level: 'Intermedio' },
      { name: 'Liderazgo', type: 'COMPETENCIA' },
    ],
    experiences: [
      {
        title: 'Sensores para monitoreo de alimentos',
        organization: 'Semillero de Investigación',
        period: '2024',
        description: 'Prototipo IoT de temperatura y humedad.',
      },
    ],
  },
  {
    fullName: 'Valentina Ortiz',
    email: 'valentina.ortiz@conectau.test',
    program: 'Ing. de Sistemas',
    headline: 'Estudiante de Ingeniería de Sistemas',
    studyGroup: 'Semillero de Software · Grupo A',
    availabilityStatus: 'NO_DISPONIBLE',
    weeklyHours: '0 horas',
    modality: 'Remoto',
    skills: [
      { name: 'Java', type: 'CONOCIMIENTO', level: 'Intermedio' },
      { name: 'Spring Boot', type: 'CONOCIMIENTO', level: 'Básico' },
      { name: 'Gestión del tiempo', type: 'COMPETENCIA' },
    ],
    experiences: [],
  },
  {
    fullName: 'Julián Cáceres',
    email: 'julian.caceres@conectau.test',
    program: 'Ing. Industrial',
    headline: 'Estudiante de Ingeniería Industrial',
    studyGroup: 'Semillero de Investigación · Grupo D',
    availabilityStatus: 'PARCIAL',
    weeklyHours: '5 horas',
    modality: 'Presencial / Remoto',
    skills: [
      { name: 'Gestión de proyectos', type: 'COMPETENCIA' },
      { name: 'Excel avanzado', type: 'CONOCIMIENTO', level: 'Avanzado' },
      { name: 'Lean Manufacturing', type: 'CONOCIMIENTO', level: 'Intermedio' },
    ],
    experiences: [
      {
        title: 'Practicante de logística',
        organization: 'Empresa local',
        period: '2024',
        description: 'Optimización de inventario y rutas.',
      },
    ],
  },
  {
    fullName: 'Camila Rojas',
    email: 'camila.rojas@conectau.test',
    program: 'Ing. de Sistemas',
    headline: '',
    studyGroup: '',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: '',
    modality: '',
    skills: [],
    experiences: [],
  },
];

const PROJECTS: SeedProject[] = [
  {
    leaderEmail: 'laura.mendez@conectau.test',
    title: 'SISGELAB — Sistema de gestión de laboratorios',
    summary:
      'Plataforma web para reservar laboratorios y controlar préstamos e inventario con trazabilidad.',
    objectives:
      'Digitalizar reservas, registrar préstamos de equipos y generar reportes de uso para la coordinación.',
    knownSkills: ['React', 'NestJS', 'PostgreSQL'],
    semillero: 'Semillero de Software',
    program: 'Ing. de Sistemas',
    status: 'BORRADOR',
  },
  {
    leaderEmail: 'laura.mendez@conectau.test',
    title: 'Reducción de desperdicio de alimentos (IoT)',
    summary:
      'Monitoreo de temperatura y humedad en cafeterías para reducir el desperdicio de alimentos.',
    objectives:
      'Instalar sensores, analizar datos de conservación y proponer alertas tempranas.',
    knownSkills: ['IoT', 'Arduino', 'Python'],
    semillero: 'Semillero de Investigación',
    program: 'Ing. Electrónica',
    status: 'EN_ANALISIS',
  },
  {
    leaderEmail: 'laura.mendez@conectau.test',
    title: 'Gestión de visitas empresariales',
    summary:
      'Aplicación para programar y documentar visitas empresariales del programa.',
    objectives:
      'Centralizar solicitudes, agendar visitas y registrar evidencias y asistentes.',
    knownSkills: ['Next.js', 'UI/UX'],
    semillero: 'Semillero de Software',
    program: 'Ing. Industrial',
    status: 'ANALIZADO',
  },
  {
    leaderEmail: 'mario.quintero@conectau.test',
    title: 'Tablero de indicadores académicos',
    summary:
      'Dashboard con indicadores de deserción y desempeño por programa académico.',
    objectives:
      'Consolidar datos institucionales y visualizarlos para apoyar la toma de decisiones.',
    knownSkills: ['SQL', 'Power BI', 'Análisis de datos'],
    semillero: 'Semillero de Datos',
    program: 'Ing. de Sistemas',
    status: 'BORRADOR',
  },
  {
    leaderEmail: 'mario.quintero@conectau.test',
    title: 'Optimización de rutas de transporte universitario',
    summary:
      'Modelo de optimización de rutas para el transporte de estudiantes al campus.',
    objectives:
      'Reducir tiempos de desplazamiento y costos con un modelo de rutas basado en datos.',
    knownSkills: ['Python', 'Lean Manufacturing'],
    semillero: 'Semillero de Investigación',
    program: 'Ing. Industrial',
    status: 'BORRADOR',
  },
];

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
  const collaborators = AppDataSource.getRepository(CollaboratorOrmEntity);
  const projects = AppDataSource.getRepository(ProjectOrmEntity);

  const ensureUser = async (
    fullName: string,
    email: string,
    role: 'ADMIN' | 'LIDER' | 'COLABORADOR',
    program: string,
  ) => {
    const existing = await users.findOne({ where: { email } });
    if (existing) return { user: existing, created: false };
    const user = await users.save(
      users.create({ fullName, email, role, program, passwordHash }),
    );
    return { user, created: true };
  };

  const counters = { users: 0, projects: 0 };

  await ensureUser(
    'Administrador',
    'admin@conectau.test',
    'ADMIN',
    'Administración',
  ).then(({ created }) => created && counters.users++);

  const leaderIds = new Map<string, string>();
  for (const leader of LEADERS) {
    const { user, created } = await ensureUser(
      leader.fullName,
      leader.email,
      'LIDER',
      leader.program,
    );
    leaderIds.set(leader.email, user.id);
    if (created) counters.users++;
  }

  for (const data of COLLABORATORS) {
    const { user, created } = await ensureUser(
      data.fullName,
      data.email,
      'COLABORADOR',
      data.program,
    );
    if (!created) continue;
    counters.users++;

    await collaborators.save(
      collaborators.create({
        userId: user.id,
        headline: data.headline || null,
        studyGroup: data.studyGroup || null,
        availabilityStatus: data.availabilityStatus,
        weeklyHours: data.weeklyHours || null,
        modality: data.modality || null,
        skills: data.skills.map((skill) => ({
          name: skill.name,
          type: skill.type,
          level: skill.level ?? null,
        })),
        experiences: data.experiences,
      }),
    );
  }

  for (const project of PROJECTS) {
    const leaderId = leaderIds.get(project.leaderEmail);
    if (!leaderId) continue;
    const exists = await projects.findOne({
      where: { leaderId, title: project.title },
    });
    if (exists) continue;
    await projects.save(
      projects.create({
        leaderId,
        title: project.title,
        summary: project.summary,
        objectives: project.objectives,
        knownSkills: project.knownSkills,
        semillero: project.semillero,
        program: project.program,
        status: project.status,
      }),
    );
    counters.projects++;
  }

  console.log(
    `Seed completado: ${counters.users} usuarios y ${counters.projects} proyectos nuevos. Contraseña de todos: ${PASSWORD}`,
  );
  await AppDataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
