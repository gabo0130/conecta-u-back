import type { SkillCategory } from '../../../domain/entities/skill-category.type';
import type { SkillType } from '../../../domain/entities/skill-type.type';

export interface SeedSkill {
  name: string;
  type: SkillType;
  category: SkillCategory;
  synonyms?: string[];
}

/**
 * Ampliación del catálogo (v2.2, E6): habilidades de otras carreras de la UFPS, para que el
 * análisis con IA y las recomendaciones sirvan también fuera de Ingeniería de Sistemas.
 * Clasificación v2.2: CONOCIMIENTO = conocimiento técnico (herramientas y tecnologías),
 * COMPETENCIA = competencia técnica (rol o disciplina), HABILIDAD_BLANDA = competencia blanda.
 */
export const UFPS_CAREER_SKILLS: SeedSkill[] = [
  // Ingeniería civil
  {
    name: 'AutoCAD',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['autocad civil 3d', 'civil 3d'],
  },
  {
    name: 'Revit',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['bim', 'modelado bim'],
  },
  {
    name: 'SAP2000',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['sap 2000', 'etabs'],
  },
  {
    name: 'Topografía',
    type: 'CONOCIMIENTO',
    category: 'OTRA',
    synonyms: ['levantamiento topográfico', 'estación total'],
  },
  {
    name: 'Diseño estructural',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['análisis estructural', 'cálculo estructural'],
  },
  {
    name: 'Interventoría de obras',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['interventoría', 'supervisión de obra'],
  },
  // Ingeniería industrial
  {
    name: 'Seis Sigma',
    type: 'CONOCIMIENTO',
    category: 'METODOLOGIA',
    synonyms: ['six sigma', 'lean six sigma'],
  },
  {
    name: 'Control estadístico de procesos',
    type: 'CONOCIMIENTO',
    category: 'METODOLOGIA',
    synonyms: ['spc', 'control de calidad'],
  },
  {
    name: 'ISO 9001',
    type: 'CONOCIMIENTO',
    category: 'METODOLOGIA',
    synonyms: ['sistema de gestión de calidad', 'sgc'],
  },
  {
    name: 'Logística y cadena de suministro',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['logística', 'cadena de suministro', 'supply chain'],
  },
  {
    name: 'Seguridad y salud en el trabajo',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['sst', 'sg-sst', 'salud ocupacional'],
  },
  // Ingeniería electrónica y mecánica
  {
    name: 'MATLAB',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['simulink'],
  },
  {
    name: 'PLC',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: [
      'controladores lógicos programables',
      'automatización industrial',
    ],
  },
  {
    name: 'Diseño de circuitos electrónicos',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['diseño de pcb', 'circuitos impresos', 'electrónica analógica'],
  },
  {
    name: 'SolidWorks',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['solid works', 'modelado 3d mecánico'],
  },
  {
    name: 'ANSYS',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['elementos finitos', 'fea'],
  },
  {
    name: 'Mantenimiento industrial',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['mantenimiento preventivo', 'mantenimiento predictivo'],
  },
  // Ingeniería ambiental
  {
    name: 'ArcGIS',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['qgis', 'sig', 'sistemas de información geográfica'],
  },
  {
    name: 'Calidad del agua',
    type: 'CONOCIMIENTO',
    category: 'OTRA',
    synonyms: ['muestreo de agua', 'análisis fisicoquímico'],
  },
  {
    name: 'Evaluación de impacto ambiental',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['eia', 'estudio de impacto ambiental', 'licencia ambiental'],
  },
  {
    name: 'Gestión de residuos',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['residuos sólidos', 'pgirs'],
  },
  // Arquitectura
  {
    name: 'SketchUp',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['sketch up'],
  },
  {
    name: 'Diseño arquitectónico',
    type: 'COMPETENCIA',
    category: 'DISENO_UX',
    synonyms: ['diseño de espacios', 'anteproyecto arquitectónico'],
  },
  {
    name: 'Urbanismo',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['planeación urbana', 'ordenamiento territorial'],
  },
  // Enfermería
  {
    name: 'Atención de enfermería',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['cuidado de enfermería', 'proceso de atención de enfermería'],
  },
  {
    name: 'Salud pública',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['promoción y prevención', 'epidemiología comunitaria'],
  },
  {
    name: 'Primeros auxilios',
    type: 'CONOCIMIENTO',
    category: 'OTRA',
    synonyms: ['soporte vital básico', 'rcp'],
  },
  {
    name: 'Bioseguridad',
    type: 'CONOCIMIENTO',
    category: 'METODOLOGIA',
    synonyms: ['protocolos de bioseguridad'],
  },
  // Contaduría y administración
  {
    name: 'Normas NIIF',
    type: 'CONOCIMIENTO',
    category: 'METODOLOGIA',
    synonyms: [
      'niif',
      'ifrs',
      'normas internacionales de información financiera',
    ],
  },
  {
    name: 'Software contable',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['siigo', 'world office', 'helisa'],
  },
  {
    name: 'Auditoría',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['revisoría fiscal', 'auditoría financiera', 'control interno'],
  },
  {
    name: 'Análisis financiero',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['finanzas', 'evaluación financiera de proyectos'],
  },
  {
    name: 'Legislación tributaria',
    type: 'CONOCIMIENTO',
    category: 'OTRA',
    synonyms: ['impuestos', 'tributaria', 'declaración de renta'],
  },
  {
    name: 'Formulación de proyectos',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: [
      'metodología mga',
      'marco lógico',
      'formulación y evaluación de proyectos',
    ],
  },
  {
    name: 'Planeación estratégica',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['plan estratégico', 'direccionamiento estratégico'],
  },
  {
    name: 'Mercadeo',
    type: 'COMPETENCIA',
    category: 'COMUNICACION',
    synonyms: ['marketing', 'investigación de mercados'],
  },
  {
    name: 'Emprendimiento',
    type: 'COMPETENCIA',
    category: 'GESTION',
    synonyms: ['plan de negocios', 'modelo de negocio'],
  },
  // Comunicación social
  {
    name: 'Producción audiovisual',
    type: 'COMPETENCIA',
    category: 'COMUNICACION',
    synonyms: ['edición de video', 'realización audiovisual'],
  },
  {
    name: 'Adobe Premiere',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['premiere pro'],
  },
  {
    name: 'Adobe Illustrator',
    type: 'CONOCIMIENTO',
    category: 'DISENO_UX',
    synonyms: ['illustrator'],
  },
  {
    name: 'Periodismo',
    type: 'COMPETENCIA',
    category: 'COMUNICACION',
    synonyms: ['redacción periodística', 'reportería'],
  },
  {
    name: 'Comunicación organizacional',
    type: 'COMPETENCIA',
    category: 'COMUNICACION',
    synonyms: ['comunicación corporativa', 'comunicación interna'],
  },
  {
    name: 'Gestión de redes sociales',
    type: 'COMPETENCIA',
    category: 'COMUNICACION',
    synonyms: ['community manager', 'social media', 'marketing digital'],
  },
  // Derecho
  {
    name: 'Derecho administrativo',
    type: 'CONOCIMIENTO',
    category: 'OTRA',
    synonyms: ['contratación estatal', 'contratación pública'],
  },
  {
    name: 'Protección de datos personales',
    type: 'CONOCIMIENTO',
    category: 'OTRA',
    synonyms: ['habeas data', 'ley 1581'],
  },
  {
    name: 'Asesoría jurídica',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['asesoría legal', 'consultoría jurídica'],
  },
  {
    name: 'Propiedad intelectual',
    type: 'CONOCIMIENTO',
    category: 'OTRA',
    synonyms: ['derechos de autor', 'patentes'],
  },
  // Trabajo social
  {
    name: 'Intervención comunitaria',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['trabajo comunitario', 'desarrollo comunitario'],
  },
  {
    name: 'Investigación cualitativa',
    type: 'CONOCIMIENTO',
    category: 'METODOLOGIA',
    synonyms: ['entrevistas', 'grupos focales', 'etnografía'],
  },
  {
    name: 'Atlas.ti',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['atlas ti', 'nvivo'],
  },
  {
    name: 'SPSS',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['ibm spss'],
  },
  {
    name: 'Investigador',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: ['investigación formativa', 'semillero de investigación'],
  },
  // Licenciaturas
  {
    name: 'Diseño curricular',
    type: 'COMPETENCIA',
    category: 'OTRA',
    synonyms: [
      'planeación curricular',
      'diseño de cursos',
      'secuencias didácticas',
    ],
  },
  {
    name: 'Didáctica',
    type: 'CONOCIMIENTO',
    category: 'METODOLOGIA',
    synonyms: ['pedagogía', 'estrategias didácticas'],
  },
  {
    name: 'Moodle',
    type: 'CONOCIMIENTO',
    category: 'HERRAMIENTA',
    synonyms: ['aulas virtuales', 'lms'],
  },
  {
    name: 'Inglés',
    type: 'CONOCIMIENTO',
    category: 'COMUNICACION',
    synonyms: ['english', 'segunda lengua'],
  },
  // Competencias blandas comunes a todas las carreras
  {
    name: 'Ética profesional',
    type: 'HABILIDAD_BLANDA',
    category: 'OTRA',
    synonyms: ['ética', 'integridad'],
  },
  {
    name: 'Trabajo interdisciplinario',
    type: 'HABILIDAD_BLANDA',
    category: 'TRABAJO_EQUIPO',
    synonyms: ['equipos interdisciplinarios', 'trabajo multidisciplinario'],
  },
  {
    name: 'Sensibilidad social',
    type: 'HABILIDAD_BLANDA',
    category: 'OTRA',
    synonyms: ['compromiso social', 'vocación de servicio'],
  },
  {
    name: 'Tolerancia a la presión',
    type: 'HABILIDAD_BLANDA',
    category: 'GESTION',
    synonyms: ['trabajo bajo presión', 'manejo del estrés'],
  },
  {
    name: 'Comunicación asertiva',
    type: 'HABILIDAD_BLANDA',
    category: 'COMUNICACION',
    synonyms: ['asertividad'],
  },
  {
    name: 'Organización',
    type: 'HABILIDAD_BLANDA',
    category: 'GESTION',
    synonyms: ['planificación personal'],
  },
  {
    name: 'Toma de decisiones',
    type: 'HABILIDAD_BLANDA',
    category: 'LIDERAZGO',
  },
  {
    name: 'Mediación',
    type: 'HABILIDAD_BLANDA',
    category: 'TRABAJO_EQUIPO',
    synonyms: ['conciliación'],
  },
];
