// Necesidades de prueba (casos de evaluación) escritas en lenguaje natural, como las registraría
// un formulador de la UFPS. Cada una trae los perfiles requeridos que se esperan y el arquetipo
// que se considera pertinente para cada perfil (base del "ground truth" sintético).

export type Level = 'BASICO' | 'INTERMEDIO' | 'AVANZADO' | 'EXPERTO';
export type Importance = 'ALTA' | 'MEDIA' | 'BAJA';

export interface NeedProfile {
  name: string;
  /** Arquetipo pertinente (relevancia 2); los de `alsoRelevant` valen 1. */
  archetype: string;
  alsoRelevant?: string[];
  skills: { name: string; minLevel: Level; importance: Importance }[];
  minWeeklyHours: number | null;
}

export interface TestNeed {
  id: string;
  /** Tipo de necesidad según el anteproyecto (académica, administrativa, investigativa…). */
  kind: 'ACADEMICA' | 'ADMINISTRATIVA' | 'INVESTIGATIVA' | 'TECNOLOGICA' | 'BIENESTAR' | 'INFRAESTRUCTURA' | 'INNOVACION';
  text: string;
  projectType: 'INVESTIGACION' | 'CURSO' | 'INTERDISCIPLINARIO' | 'EXTENSION';
  profiles: NeedProfile[];
}

const s = (name: string, minLevel: Level = 'INTERMEDIO', importance: Importance = 'ALTA') => ({ name, minLevel, importance });

export const TEST_NEEDS: TestNeed[] = [
  {
    id: 'N01', kind: 'ADMINISTRATIVA', projectType: 'INTERDISCIPLINARIO',
    text: 'La oficina de Bienestar necesita una plataforma web para que los estudiantes reserven citas de psicología y medicina, con recordatorios por correo y un tablero para la coordinación.',
    profiles: [
      { name: 'Desarrollador backend', archetype: 'backend', skills: [s('Node.js'), s('PostgreSQL'), s('APIs REST'), s('Diseño de bases de datos', 'BASICO', 'MEDIA')], minWeeklyHours: 8 },
      { name: 'Desarrollador frontend', archetype: 'frontend', alsoRelevant: ['mobile'], skills: [s('React'), s('TypeScript'), s('CSS', 'INTERMEDIO', 'MEDIA')], minWeeklyHours: 8 },
      { name: 'Diseñador UX', archetype: 'ux', skills: [s('Figma'), s('Usabilidad'), s('Investigación de usuarios', 'BASICO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N02', kind: 'INVESTIGATIVA', projectType: 'INVESTIGACION',
    text: 'Queremos predecir la deserción estudiantil en los primeros semestres usando datos académicos y socioeconómicos, y presentar los resultados en un tablero para los directores de programa.',
    profiles: [
      { name: 'Científico de datos', archetype: 'data', skills: [s('Python', 'AVANZADO'), s('Machine Learning'), s('Estadística')], minWeeklyHours: 10 },
      { name: 'Analista de visualización', archetype: 'data', alsoRelevant: ['pm'], skills: [s('Power BI'), s('Análisis de datos'), s('SQL', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Investigador educativo', archetype: 'research', skills: [s('Metodología de la investigación'), s('SPSS', 'BASICO', 'MEDIA'), s('Redacción académica')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N03', kind: 'INNOVACION', projectType: 'INVESTIGACION',
    text: 'El semillero de electrónica propone una red de sensores IoT para monitorear la humedad del suelo en cultivos de la región y enviar alertas a los agricultores por una app móvil.',
    profiles: [
      { name: 'Ingeniero IoT', archetype: 'iot', skills: [s('IoT'), s('Arduino'), s('Diseño de circuitos electrónicos')], minWeeklyHours: 10 },
      { name: 'Desarrollador móvil', archetype: 'mobile', alsoRelevant: ['frontend'], skills: [s('Flutter'), s('Firebase'), s('Desarrollo móvil')], minWeeklyHours: 6 },
      { name: 'Especialista agroambiental', archetype: 'environment', skills: [s('Calidad del agua', 'BASICO', 'MEDIA'), s('Evaluación de impacto ambiental', 'BASICO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N04', kind: 'INFRAESTRUCTURA', projectType: 'EXTENSION',
    text: 'La División de Sistemas necesita fortalecer la seguridad de los servidores institucionales, automatizar los despliegues y documentar la arquitectura de red.',
    profiles: [
      { name: 'Ingeniero DevOps', archetype: 'devops', alsoRelevant: ['backend'], skills: [s('Docker'), s('Linux'), s('CI/CD')], minWeeklyHours: 10 },
      { name: 'Analista de seguridad', archetype: 'devops', skills: [s('Ciberseguridad', 'AVANZADO'), s('Redes de computadores')], minWeeklyHours: 8 },
    ],
  },
  {
    id: 'N05', kind: 'ACADEMICA', projectType: 'CURSO',
    text: 'Para el curso de Ingeniería de Software se busca construir un sistema de inventario para los laboratorios de la facultad, aplicando Scrum y pruebas automatizadas.',
    profiles: [
      { name: 'Desarrollador full stack', archetype: 'backend', alsoRelevant: ['frontend'], skills: [s('Java'), s('Spring Boot'), s('SQL'), s('Pruebas de software', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Scrum Master', archetype: 'pm', skills: [s('Scrum'), s('Gestión de proyectos'), s('Liderazgo', 'INTERMEDIO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N06', kind: 'BIENESTAR', projectType: 'EXTENSION',
    text: 'Se requiere una campaña de promoción de la salud mental y hábitos saludables en los barrios cercanos a la universidad, con material audiovisual y jornadas comunitarias.',
    profiles: [
      { name: 'Promotor de salud comunitaria', archetype: 'health', skills: [s('Salud pública'), s('Intervención comunitaria'), s('Empatía', 'INTERMEDIO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Productor audiovisual', archetype: 'communication', skills: [s('Producción audiovisual'), s('Adobe Premiere'), s('Gestión de redes sociales', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
    ],
  },
  {
    id: 'N07', kind: 'INFRAESTRUCTURA', projectType: 'INTERDISCIPLINARIO',
    text: 'La universidad planea un nuevo bloque de aulas con criterios de sostenibilidad: se necesita el diseño estructural, los planos y la evaluación de impacto ambiental.',
    profiles: [
      { name: 'Ingeniero estructural', archetype: 'civil', skills: [s('SAP2000'), s('Diseño estructural', 'AVANZADO'), s('AutoCAD')], minWeeklyHours: 10 },
      { name: 'Especialista ambiental', archetype: 'environment', skills: [s('Evaluación de impacto ambiental'), s('ArcGIS', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
    ],
  },
  {
    id: 'N08', kind: 'ADMINISTRATIVA', projectType: 'EXTENSION',
    text: 'Una cooperativa de la región pide apoyo para ordenar su contabilidad bajo NIIF, revisar sus contratos y cumplir la ley de protección de datos personales.',
    profiles: [
      { name: 'Asesor contable', archetype: 'finance_legal', skills: [s('Normas NIIF'), s('Software contable'), s('Auditoría', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Asesor jurídico', archetype: 'finance_legal', skills: [s('Protección de datos personales'), s('Asesoría jurídica')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N09', kind: 'TECNOLOGICA', projectType: 'INVESTIGACION',
    text: 'Proyecto de visión por computador para clasificar automáticamente la calidad de frutas en una planta agroindustrial con cámaras de bajo costo.',
    profiles: [
      { name: 'Ingeniero de aprendizaje automático', archetype: 'data', skills: [s('TensorFlow'), s('Python', 'AVANZADO'), s('Inteligencia artificial')], minWeeklyHours: 10 },
      { name: 'Ingeniero electrónico', archetype: 'iot', skills: [s('Raspberry Pi'), s('C++', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Analista de procesos', archetype: 'industrial', skills: [s('Control estadístico de procesos'), s('Lean Manufacturing', 'BASICO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N10', kind: 'ACADEMICA', projectType: 'CURSO',
    text: 'El programa de Licenciatura en Matemáticas quiere un curso virtual de nivelación en Moodle con recursos interactivos y una evaluación de su efecto en el rendimiento.',
    profiles: [
      { name: 'Diseñador instruccional', archetype: 'research', skills: [s('Moodle'), s('Diseño curricular'), s('Didáctica')], minWeeklyHours: 6 },
      { name: 'Desarrollador web de recursos', archetype: 'frontend', skills: [s('JavaScript'), s('HTML'), s('Desarrollo web', 'BASICO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N11', kind: 'INNOVACION', projectType: 'INTERDISCIPLINARIO',
    text: 'Emprendimiento estudiantil que busca lanzar una app de domicilios para tenderos de barrio; necesita validar el modelo de negocio, diseñar la experiencia y construir el prototipo.',
    profiles: [
      { name: 'Gestor de emprendimiento', archetype: 'pm', alsoRelevant: ['communication'], skills: [s('Emprendimiento'), s('Planeación estratégica'), s('Mercadeo', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Diseñador de experiencia', archetype: 'ux', skills: [s('Design Thinking'), s('Prototipado'), s('Figma')], minWeeklyHours: 6 },
      { name: 'Desarrollador móvil', archetype: 'mobile', skills: [s('Flutter'), s('Desarrollo móvil')], minWeeklyHours: 8 },
    ],
  },
  {
    id: 'N12', kind: 'ADMINISTRATIVA', projectType: 'EXTENSION',
    text: 'Una empresa manufacturera del área metropolitana necesita reducir desperdicios en su línea de producción e implementar un sistema de gestión de calidad.',
    profiles: [
      { name: 'Ingeniero de mejora continua', archetype: 'industrial', skills: [s('Lean Manufacturing'), s('Seis Sigma'), s('Control estadístico de procesos')], minWeeklyHours: 8 },
      { name: 'Auditor de calidad', archetype: 'industrial', alsoRelevant: ['finance_legal'], skills: [s('ISO 9001'), s('Auditoría', 'BASICO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N13', kind: 'INVESTIGATIVA', projectType: 'INVESTIGACION',
    text: 'Investigación sobre la calidad del agua del río Pamplonita: muestreo, análisis de laboratorio, mapas de riesgo y un visor web para la comunidad.',
    profiles: [
      { name: 'Investigador ambiental', archetype: 'environment', skills: [s('Calidad del agua', 'AVANZADO'), s('Investigador')], minWeeklyHours: 8 },
      { name: 'Analista SIG', archetype: 'environment', alsoRelevant: ['data'], skills: [s('ArcGIS'), s('Análisis de datos', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Desarrollador web', archetype: 'frontend', alsoRelevant: ['backend'], skills: [s('JavaScript'), s('Desarrollo web')], minWeeklyHours: 6 },
    ],
  },
  {
    id: 'N14', kind: 'BIENESTAR', projectType: 'EXTENSION',
    text: 'Programa de formación docente para incorporar metodologías activas y herramientas digitales en las clases de los colegios del municipio.',
    profiles: [
      { name: 'Formador docente', archetype: 'research', skills: [s('Capacitación y docencia'), s('Didáctica'), s('Hablar en público', 'INTERMEDIO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Comunicador', archetype: 'communication', skills: [s('Comunicación organizacional'), s('Producción audiovisual', 'BASICO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N15', kind: 'TECNOLOGICA', projectType: 'CURSO',
    text: 'Sistema para gestionar los préstamos de equipos del laboratorio de electrónica con lectores RFID y una aplicación web para los monitores.',
    profiles: [
      { name: 'Desarrollador de hardware', archetype: 'iot', skills: [s('Arduino'), s('IoT'), s('C++')], minWeeklyHours: 6 },
      { name: 'Desarrollador backend', archetype: 'backend', skills: [s('APIs REST'), s('PostgreSQL'), s('Node.js', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
    ],
  },
  {
    id: 'N16', kind: 'INVESTIGATIVA', projectType: 'INVESTIGACION',
    text: 'Estudio cualitativo sobre las experiencias de estudiantes migrantes en la UFPS, con entrevistas, análisis en Atlas.ti y un informe para Bienestar.',
    profiles: [
      { name: 'Investigador cualitativo', archetype: 'research', alsoRelevant: ['health'], skills: [s('Investigación cualitativa', 'AVANZADO'), s('Atlas.ti'), s('Redacción académica')], minWeeklyHours: 6 },
      { name: 'Trabajador social', archetype: 'health', skills: [s('Intervención comunitaria'), s('Sensibilidad social', 'INTERMEDIO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N17', kind: 'INFRAESTRUCTURA', projectType: 'EXTENSION',
    text: 'Levantamiento topográfico y diseño de un parque biosaludable para un barrio, con presupuesto de obra y acompañamiento a la junta de acción comunal.',
    profiles: [
      { name: 'Topógrafo', archetype: 'civil', skills: [s('Topografía', 'AVANZADO'), s('AutoCAD')], minWeeklyHours: 6 },
      { name: 'Diseñador urbano', archetype: 'civil', skills: [s('Urbanismo'), s('SketchUp'), s('Diseño arquitectónico', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Gestor comunitario', archetype: 'health', alsoRelevant: ['pm'], skills: [s('Intervención comunitaria'), s('Comunicación asertiva', 'INTERMEDIO', 'MEDIA')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N18', kind: 'ADMINISTRATIVA', projectType: 'INTERDISCIPLINARIO',
    text: 'La Vicerrectoría de Investigación quiere un tablero de indicadores de producción científica por grupo, alimentado desde hojas de cálculo y bases de datos.',
    profiles: [
      { name: 'Analista de datos', archetype: 'data', skills: [s('Power BI', 'AVANZADO'), s('SQL'), s('Excel avanzado')], minWeeklyHours: 8 },
      { name: 'Gestor del proyecto', archetype: 'pm', skills: [s('Formulación de proyectos'), s('Gestión de proyectos')], minWeeklyHours: 4 },
    ],
  },
  {
    id: 'N19', kind: 'TECNOLOGICA', projectType: 'INTERDISCIPLINARIO',
    text: 'Chatbot con inteligencia artificial para responder las preguntas frecuentes de admisiones y matrícula, integrado al sitio web institucional.',
    profiles: [
      { name: 'Ingeniero de IA', archetype: 'data', alsoRelevant: ['backend'], skills: [s('Inteligencia artificial'), s('Python'), s('Machine Learning', 'BASICO', 'MEDIA')], minWeeklyHours: 8 },
      { name: 'Desarrollador backend', archetype: 'backend', skills: [s('APIs REST'), s('Node.js'), s('Docker', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Comunicador institucional', archetype: 'communication', skills: [s('Comunicación organizacional'), s('Periodismo', 'BASICO', 'MEDIA')], minWeeklyHours: 3 },
    ],
  },
  {
    id: 'N20', kind: 'BIENESTAR', projectType: 'EXTENSION',
    text: 'Plan de seguridad y salud en el trabajo para los talleres y laboratorios de la facultad de ingeniería, con capacitación en primeros auxilios.',
    profiles: [
      { name: 'Especialista en SST', archetype: 'health', alsoRelevant: ['industrial'], skills: [s('Seguridad y salud en el trabajo'), s('Primeros auxilios'), s('Bioseguridad', 'BASICO', 'MEDIA')], minWeeklyHours: 6 },
      { name: 'Capacitador', archetype: 'research', alsoRelevant: ['health'], skills: [s('Capacitación y docencia'), s('Hablar en público', 'INTERMEDIO', 'MEDIA')], minWeeklyHours: 3 },
    ],
  },
];
