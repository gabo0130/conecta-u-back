const { useLandscape, build, cover, h1, p, bullets, note, table, spacer } = require('./lib');
useLandscape();

// Fase 1 DSR: matriz de revisión documental (plantilla con los documentos sugeridos a revisar).
const DOCUMENTS = [
  ['D01', 'Formato de proyecto de aula del programa', 'Formato institucional', 'Coordinación del programa'],
  ['D02', 'Términos de referencia de convocatorias internas de investigación', 'Convocatoria', 'Vicerrectoría Asistente de Investigación y Extensión'],
  ['D03', 'Plan de Desarrollo Institucional vigente', 'Plan institucional', 'Planeación UFPS'],
  ['D04', 'Proyecto Educativo del Programa (PEP) de Ingeniería de Sistemas', 'Documento académico', 'Programa de Ingeniería de Sistemas'],
  ['D05', 'Reglamento de semilleros y grupos de investigación', 'Reglamento', 'Vicerrectoría de Investigación'],
  ['D06', 'Formatos de proyectos de extensión o proyección social', 'Formato institucional', 'Extensión'],
  ['D07', 'Solicitudes o requerimientos de dependencias (Bienestar, Sistemas, laboratorios)', 'Registro de necesidades', 'Dependencias'],
  ['D08', 'Planificación Alcance Global v2.2 de Conecta U (seminario)', 'Documento del artefacto', 'Seminario Integrador III'],
];

const children = [
  ...cover({
    code: 'F1-03',
    title: 'Matriz de revisión documental',
    subtitle: 'Elementos de las necesidades, perfiles y proyectos en los documentos institucionales',
    phase: 'Fase 1 – Identificación del problema y motivación',
    extra: [['Responsable', 'Walter Steven Casadiegos Quintero']],
  }),
  h1('1. Propósito y procedimiento'),
  p('La matriz organiza lo que dicen los documentos institucionales sobre cómo se formula una necesidad o un proyecto, qué se exige de los participantes y cómo se prioriza. Cada hallazgo se codifica con la categoría y la variable de la investigación para alimentar la matriz de trazabilidad (F1-04).'),
  bullets([
    'Registrar cada documento revisado con su fuente y fecha de consulta (sección 2).',
    'Por cada documento, anotar los **elementos** que menciona (campos, requisitos, criterios), con la página o sección exacta (sección 3).',
    'Clasificar cada elemento en una categoría (Necesidades, Competencias, Recomendación, Usabilidad, Priorización) y su variable.',
    'Marcar si el elemento coincide con lo dicho en las entrevistas (contraste) y si da origen a un requisito.',
  ]),
  note('La lista de la sección 2 es una **propuesta** de documentos a revisar: se confirma o se ajusta según lo que esté disponible. Las celdas de hallazgos se diligencian durante la revisión; no se deben completar con supuestos.', 'F2F2F2'),
  h1('2. Documentos a revisar'),
  table(['Código', 'Documento', 'Tipo', 'Fuente / dependencia', 'Versión o fecha', 'Fecha de consulta', '¿Disponible?'], DOCUMENTS.map((d) => [...d, '', '', '☐ Sí ☐ No']), [7, 30, 13, 20, 10, 10, 10], { minHeight: 420 }),
  spacer(),
  h1('3. Registro de hallazgos'),
  table(
    ['Doc.', 'Página / sección', 'Elemento identificado (cita o paráfrasis)', 'Categoría', 'Variable', 'Coincide con entrevistas', 'Requisito que origina'],
    [
      ['Ej.: D01', 'Sección 2', '«Objetivo general y específicos del proyecto»', 'Necesidades', 'Caracterización de necesidades', '☐ Sí ☐ No ☐ Parcial', 'Objetivo como elemento del índice de completitud'],
      ...Array.from({ length: 12 }, () => ['', '', '', '', '', '☐ Sí ☐ No ☐ Parcial', '']),
    ],
    [7, 9, 30, 11, 14, 12, 17],
    { minHeight: 480 },
  ),
  spacer(),
  h1('4. Síntesis'),
  table(['Categoría', 'Elementos recurrentes (≥ 2 documentos)', 'Diferencias con las entrevistas', 'Decisión para el diseño'], [
    ['Necesidades', '', '', ''],
    ['Competencias y perfiles', '', '', ''],
    ['Recomendación', '', '', ''],
    ['Priorización', '', '', ''],
    ['Usabilidad', '', '', ''],
  ], [16, 32, 26, 26], { minHeight: 700 }),
];

build('F1-03 Matriz de revision documental.docx', 'F1-03', children, { landscape: true });
