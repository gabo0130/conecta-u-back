// Arquetipos de perfiles de la comunidad UFPS para el conjunto de datos sintético de la tesis
// (evaluación preliminar del recomendador, Fase 4 DSR). Las habilidades usan los nombres exactos
// del catálogo de Conecta U para que el emparejamiento sea el mismo que en producción.

export interface Archetype {
  key: string;
  label: string;
  programs: string[];
  /** Conocimientos técnicos (los primeros son los más característicos). */
  knowledge: string[];
  competencies: string[];
  soft: string[];
  roles: string[];
  organizations: string[];
  /** Frases para el resumen del perfil (texto del embedding). */
  phrases: string[];
}

export const ARCHETYPES: Archetype[] = [
  {
    key: 'backend',
    label: 'Desarrollo backend',
    programs: ['ISI'],
    knowledge: ['Node.js', 'NestJS', 'PostgreSQL', 'APIs REST', 'SQL', 'Docker', 'Java', 'Spring Boot', 'Python', 'Django', 'PHP', 'Laravel', 'Git', 'MongoDB'],
    competencies: ['Desarrollo de software', 'Diseño de bases de datos', 'Arquitectura de software', 'Pruebas de software'],
    soft: ['Pensamiento analítico', 'Resolución de problemas', 'Trabajo en equipo', 'Aprendizaje autónomo'],
    roles: ['Desarrollador backend', 'Monitor de programación', 'Desarrollador de APIs'],
    organizations: ['Semillero de Software', 'Empresa de software local', 'División de Sistemas UFPS'],
    phrases: ['construyo servicios y APIs', 'modelo bases de datos relacionales', 'me interesa la arquitectura de software', 'desarrollo servidores con buenas prácticas'],
  },
  {
    key: 'frontend',
    label: 'Desarrollo frontend',
    programs: ['ISI'],
    knowledge: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS', 'Angular', 'Vue.js', 'Figma', 'Git'],
    competencies: ['Desarrollo web', 'Desarrollo de software', 'Pruebas de software'],
    soft: ['Creatividad', 'Orientación al detalle', 'Comunicación', 'Trabajo en equipo'],
    roles: ['Desarrolladora frontend', 'Maquetador web', 'Desarrollador web'],
    organizations: ['Agencia digital', 'Semillero de Software', 'Proyecto de aula'],
    phrases: ['creo interfaces web accesibles', 'trabajo con componentes y diseño responsivo', 'me gusta la experiencia de usuario en la web'],
  },
  {
    key: 'mobile',
    label: 'Desarrollo móvil',
    programs: ['ISI'],
    knowledge: ['Flutter', 'Firebase', 'JavaScript', 'TypeScript', 'Java', 'React', 'Git', 'APIs REST'],
    competencies: ['Desarrollo móvil', 'Desarrollo de software', 'Pruebas de software'],
    soft: ['Creatividad', 'Resolución de problemas', 'Aprendizaje autónomo', 'Iniciativa'],
    roles: ['Desarrollador móvil', 'Desarrolladora de apps'],
    organizations: ['Startup local', 'Semillero de Software'],
    phrases: ['desarrollo aplicaciones móviles', 'publico apps para Android', 'integro servicios en la nube en apps'],
  },
  {
    key: 'data',
    label: 'Ciencia de datos e IA',
    programs: ['ISI', 'EST'],
    knowledge: ['Python', 'Machine Learning', 'Estadística', 'Análisis de datos', 'TensorFlow', 'Inteligencia artificial', 'Power BI', 'SQL', 'Tableau', 'Excel avanzado'],
    competencies: ['Investigador', 'Documentación técnica', 'Diseño de bases de datos'],
    soft: ['Pensamiento analítico', 'Pensamiento crítico', 'Aprendizaje autónomo', 'Comunicación'],
    roles: ['Analista de datos', 'Auxiliar de investigación en IA', 'Científico de datos junior'],
    organizations: ['Grupo de investigación GIDIS', 'Empresa de analítica', 'Observatorio UFPS'],
    phrases: ['analizo datos y construyo modelos predictivos', 'aplico aprendizaje automático', 'visualizo indicadores en tableros'],
  },
  {
    key: 'devops',
    label: 'Infraestructura, redes y seguridad',
    programs: ['ISI', 'IEL'],
    knowledge: ['Linux', 'Docker', 'Redes de computadores', 'Ciberseguridad', 'Kubernetes', 'AWS', 'CI/CD', 'Git'],
    competencies: ['Arquitectura de software', 'Documentación técnica'],
    soft: ['Responsabilidad', 'Tolerancia a la presión', 'Resolución de problemas', 'Organización'],
    roles: ['Administrador de redes', 'Auxiliar de infraestructura', 'Analista de seguridad'],
    organizations: ['División de Sistemas UFPS', 'Proveedor de internet', 'Empresa de soporte'],
    phrases: ['administro servidores y redes', 'automatizo despliegues', 'me interesa la seguridad informática'],
  },
  {
    key: 'iot',
    label: 'Electrónica e IoT',
    programs: ['IEL', 'IEM'],
    knowledge: ['IoT', 'Arduino', 'Raspberry Pi', 'C++', 'PLC', 'MATLAB', 'Python'],
    competencies: ['Diseño de circuitos electrónicos', 'Mantenimiento industrial', 'Documentación técnica'],
    soft: ['Resolución de problemas', 'Trabajo interdisciplinario', 'Iniciativa', 'Orientación al detalle'],
    roles: ['Diseñador de prototipos electrónicos', 'Técnico en automatización', 'Investigador en IoT'],
    organizations: ['Semillero de Electrónica', 'Empresa de automatización', 'Laboratorio de electrónica UFPS'],
    phrases: ['diseño prototipos con sensores', 'programo microcontroladores', 'integro dispositivos conectados'],
  },
  {
    key: 'ux',
    label: 'Diseño UX/UI',
    programs: ['DGR', 'ISI'],
    knowledge: ['Figma', 'Diseño de interfaces', 'Usabilidad', 'Investigación de usuarios', 'Prototipado', 'Design Thinking', 'Adobe Illustrator'],
    competencies: ['Análisis de requisitos', 'Documentación técnica'],
    soft: ['Empatía', 'Creatividad', 'Escucha activa', 'Comunicación asertiva'],
    roles: ['Diseñadora UX', 'Diseñador de interfaces'],
    organizations: ['Agencia digital', 'Proyecto de aula', 'Emprendimiento estudiantil'],
    phrases: ['investigo usuarios y diseño prototipos', 'hago pruebas de usabilidad', 'diseño interfaces centradas en las personas'],
  },
  {
    key: 'pm',
    label: 'Gestión de proyectos',
    programs: ['ADE', 'IIN'],
    knowledge: ['Scrum', 'Metodologías ágiles', 'Excel avanzado', 'Power BI'],
    competencies: ['Formulación de proyectos', 'Planeación estratégica', 'Análisis de requisitos', 'Emprendimiento'],
    soft: ['Gestión de proyectos', 'Liderazgo', 'Negociación', 'Organización', 'Toma de decisiones', 'Gestión del tiempo'],
    roles: ['Coordinadora de proyecto', 'Scrum Master', 'Gestor de proyectos'],
    organizations: ['Vicerrectoría de Investigación', 'Empresa consultora', 'Emprendimiento estudiantil'],
    phrases: ['coordino equipos y cronogramas', 'formulo proyectos para convocatorias', 'aplico marcos ágiles'],
  },
  {
    key: 'research',
    label: 'Investigación educativa y social',
    programs: ['LMA', 'LEI', 'TSO', 'LCN'],
    knowledge: ['Metodología de la investigación', 'Investigación cualitativa', 'Atlas.ti', 'SPSS', 'Estadística', 'Didáctica', 'Moodle'],
    competencies: ['Investigador', 'Redacción académica', 'Diseño curricular', 'Capacitación y docencia'],
    soft: ['Pensamiento crítico', 'Comunicación', 'Escucha activa', 'Ética profesional'],
    roles: ['Docente investigador', 'Auxiliar de investigación', 'Tutor académico'],
    organizations: ['Facultad de Educación UFPS', 'Grupo de investigación en educación', 'Colegio oficial'],
    phrases: ['investigo procesos de enseñanza', 'diseño instrumentos de investigación', 'analizo entrevistas y encuestas'],
  },
  {
    key: 'civil',
    label: 'Ingeniería civil y arquitectura',
    programs: ['ICI', 'ARQ'],
    knowledge: ['AutoCAD', 'Revit', 'SAP2000', 'Topografía', 'SketchUp'],
    competencies: ['Diseño estructural', 'Interventoría de obras', 'Urbanismo', 'Diseño arquitectónico'],
    soft: ['Responsabilidad', 'Orientación al detalle', 'Trabajo en equipo', 'Toma de decisiones'],
    roles: ['Residente de obra', 'Auxiliar de diseño estructural', 'Dibujante técnico'],
    organizations: ['Constructora regional', 'Oficina de Planeación', 'Semillero de estructuras'],
    phrases: ['modelo estructuras', 'elaboro planos y presupuestos', 'acompaño la interventoría de obras'],
  },
  {
    key: 'industrial',
    label: 'Ingeniería industrial y calidad',
    programs: ['IIN', 'IME'],
    knowledge: ['Lean Manufacturing', 'Seis Sigma', 'Control estadístico de procesos', 'ISO 9001', 'Excel avanzado', 'SolidWorks'],
    competencies: ['Logística y cadena de suministro', 'Mantenimiento industrial', 'Seguridad y salud en el trabajo'],
    soft: ['Pensamiento analítico', 'Organización', 'Liderazgo', 'Resolución de problemas'],
    roles: ['Analista de procesos', 'Auxiliar de calidad', 'Practicante de logística'],
    organizations: ['Empresa manufacturera', 'Centro logístico', 'Laboratorio de procesos UFPS'],
    phrases: ['optimizo procesos productivos', 'implemento sistemas de calidad', 'mejoro la cadena de suministro'],
  },
  {
    key: 'environment',
    label: 'Ambiente y agroindustria',
    programs: ['IAM', 'IAG', 'IBT'],
    knowledge: ['Calidad del agua', 'ArcGIS', 'Bioseguridad', 'Análisis de datos'],
    competencies: ['Evaluación de impacto ambiental', 'Gestión de residuos', 'Investigador'],
    soft: ['Sensibilidad social', 'Trabajo interdisciplinario', 'Responsabilidad', 'Pensamiento crítico'],
    roles: ['Auxiliar ambiental', 'Investigadora en calidad del agua'],
    organizations: ['Corporación ambiental', 'Semillero ambiental', 'Laboratorio de aguas UFPS'],
    phrases: ['monitoreo la calidad del agua', 'evalúo impactos ambientales', 'gestiono residuos sólidos'],
  },
  {
    key: 'communication',
    label: 'Comunicación y mercadeo',
    programs: ['CSO', 'DGR', 'ADE'],
    knowledge: ['Adobe Premiere', 'Adobe Illustrator', 'Inglés'],
    competencies: ['Producción audiovisual', 'Gestión de redes sociales', 'Comunicación organizacional', 'Periodismo', 'Mercadeo'],
    soft: ['Hablar en público', 'Creatividad', 'Comunicación', 'Comunicación asertiva'],
    roles: ['Productor audiovisual', 'Community manager', 'Periodista'],
    organizations: ['Emisora UFPS', 'Agencia de mercadeo', 'Oficina de Comunicaciones'],
    phrases: ['produzco piezas audiovisuales', 'gestiono redes sociales', 'redacto contenidos para campañas'],
  },
  {
    key: 'finance_legal',
    label: 'Contabilidad y derecho',
    programs: ['CPU', 'DER'],
    knowledge: ['Normas NIIF', 'Software contable', 'Legislación tributaria', 'Excel avanzado', 'Derecho administrativo', 'Protección de datos personales', 'Propiedad intelectual'],
    competencies: ['Auditoría', 'Análisis financiero', 'Asesoría jurídica'],
    soft: ['Ética profesional', 'Orientación al detalle', 'Negociación', 'Responsabilidad'],
    roles: ['Auxiliar contable', 'Asesor jurídico', 'Practicante de auditoría'],
    organizations: ['Firma contable', 'Consultorio jurídico UFPS', 'Alcaldía'],
    phrases: ['asesoro en normativa', 'elaboro estados financieros', 'reviso contratos y protección de datos'],
  },
  {
    key: 'health',
    label: 'Salud y trabajo comunitario',
    programs: ['ENF', 'SST', 'TSO'],
    knowledge: ['Primeros auxilios', 'Bioseguridad'],
    competencies: ['Atención de enfermería', 'Salud pública', 'Intervención comunitaria', 'Seguridad y salud en el trabajo'],
    soft: ['Empatía', 'Responsabilidad', 'Sensibilidad social', 'Comunicación asertiva'],
    roles: ['Enfermera en formación', 'Promotor de salud', 'Practicante de SST'],
    organizations: ['Hospital universitario', 'Secretaría de Salud', 'Fundación comunitaria'],
    phrases: ['acompaño comunidades', 'promuevo la salud pública', 'aplico protocolos de bioseguridad'],
  },
];

export const ARCHETYPE_BY_KEY = new Map(ARCHETYPES.map((archetype) => [archetype.key, archetype]));
