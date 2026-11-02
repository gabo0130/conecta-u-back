const { build, cover, h1, h2, p, bullets, numbered, note, table, ficha, spacer, pageBreak } = require('./lib');

// Fase 1 DSR: entrevista estructurada final (Anexo A del anteproyecto, ajustado).
const QUESTIONS = [
  ['A. Identificación del actor', [
    ['A1', '¿Cuál es su rol principal en la universidad (docente de planta u ocasional, investigador, director de plan de estudios, líder de semillero o grupo, coordinador, representante de una dependencia, estudiante)?', 'Rol del actor (D2)'],
    ['A2', '¿A qué programa, departamento, dependencia o grupo de investigación está vinculado y desde hace cuánto tiempo?', 'Contexto del actor'],
    ['A3', 'En los últimos dos años, ¿en cuántos proyectos de aula, de investigación, de extensión o institucionales ha participado o ha liderado?', 'Experiencia en proyectos'],
  ]],
  ['B. Gestión actual de necesidades', [
    ['B1', '¿Por qué canales o medios identifica o recibe hoy las necesidades académicas, administrativas, investigativas o de bienestar (correo, comités, convocatorias, solicitudes directas, otros)?', 'Canales de necesidades'],
    ['B2', '¿Qué dificultades encuentra para comunicar una necesidad o para encontrar quién pueda atenderla con los recursos actuales?', 'Problema (dispersión de capacidades)'],
  ]],
  ['C. Caracterización de necesidades', [
    ['C1', 'Cuando surge una necesidad en su área, ¿qué información considera indispensable registrar para que otra persona entienda el problema y pueda proponer una solución?', 'Elementos de la necesidad'],
    ['C2', 'De los siguientes elementos, ¿cuáles considera imprescindibles y cuáles opcionales: problema, objetivo, beneficiarios, resultados esperados, competencias requeridas, plazo y dependencia que la plantea? ¿Agregaría o quitaría alguno?', 'Índice de completitud (pesos)'],
    ['C3', '¿Qué tipos de necesidades se presentan con más frecuencia (académicas, administrativas, investigativas, tecnológicas, de bienestar, de infraestructura, de innovación)?', 'Tipología de necesidades'],
  ]],
  ['D. Competencias y capacidades', [
    ['D1', '¿Cómo define y clasifica las competencias técnicas y las competencias blandas de las personas que participan en sus iniciativas?', 'Modelo de competencias'],
    ['D2', '¿Qué información sobre una persona le resulta útil para saber si puede aportar a un proyecto (conocimientos, nivel, tiempo de experiencia, experiencias previas, intereses, disponibilidad)?', 'Atributos del perfil (D5)'],
  ]],
  ['E. Criterios de recomendación de perfiles', [
    ['E1', '¿Con qué criterios (coincidencia de competencias, afinidad temática o de intereses, experiencia previa, disponibilidad de tiempo, otros) debería la plataforma recomendar personas para una necesidad? Ordénelos de más a menos importante.', 'Pesos del puntaje híbrido'],
    ['E2', '¿Le resulta útil que la recomendación muestre un porcentaje de correspondencia y la justificación de por qué se sugiere a cada persona? ¿Qué debería mostrar esa justificación?', 'Explicabilidad (RNF8)'],
  ]],
  ['F. Selección de colaboradores', [
    ['F1', 'Al buscar un colaborador para un proyecto de aula o de investigación, ¿qué criterios académicos (promedio, asignaturas cursadas, semestre) y no académicos (intereses, experiencia, compromiso) considera más críticos?', 'Criterios de selección'],
  ]],
  ['G. Priorización y recomendaciones esperadas', [
    ['G1', 'Cuando hay varias necesidades a la vez, ¿cómo decide cuál atender primero? ¿Qué peso le daría a la urgencia, al impacto y a qué tan clara esté la necesidad?', 'Priorización básica (D4)'],
    ['G2', '¿Qué sugerencias o alertas esperaría recibir del sistema al registrar una necesidad en lenguaje natural (información faltante, tipo de proyecto sugerido, competencias detectadas)?', 'Caracterización con IA'],
  ]],
  ['H. Restricciones', [
    ['H1', '¿Qué reglas debería validar el sistema de forma obligatoria (número máximo de integrantes, horas disponibles, autorización de datos, veracidad de la información, otras)?', 'Reglas de negocio'],
  ]],
  ['I. Trazabilidad', [
    ['I1', '¿Qué estados debería atravesar una necesidad desde que se registra hasta que se convierte en un proyecto (por ejemplo: registrada, caracterizada, convertida en oportunidad, descartada)?', 'Ciclo de vida de la necesidad'],
  ]],
  ['J. Validación de resultados', [
    ['J1', '¿Qué criterios usaría para decidir si una persona recomendada fue pertinente para la necesidad (muy pertinente, pertinente, no pertinente)?', 'Rúbrica de pertinencia'],
    ['J2', '¿Qué haría que usted acepte o descarte a una persona recomendada? ¿Cuántas recomendaciones revisaría como máximo (5, 10, más)?', 'Tasa de aceptación y K'],
  ]],
];

const children = [
  ...cover({
    code: 'F1-01',
    title: 'Entrevista estructurada a docentes, expertos y formuladores',
    subtitle: 'Versión final del Anexo A del anteproyecto, ajustada para la aplicación',
    phase: 'Fase 1 – Identificación del problema y motivación',
    extra: [['Responsable de la aplicación', 'Walter Steven Casadiegos Quintero (instrumentos de la Fase 1 y aplicación de entrevistas)']],
  }),
  note('Antes de iniciar, la persona entrevistada debe leer y firmar el **consentimiento informado (F1-02)**. Este formato pasa por el **juicio de expertos (F1-05)** antes de su aplicación definitiva; los ajustes que resulten se registran en la tabla de control de cambios del final.'),
  h1('1. Objetivo del instrumento'),
  p('Obtener información de docentes, investigadores, líderes de semilleros, coordinadores y representantes de dependencias de la UFPS para estructurar las variables de la investigación: caracterización de necesidades, competencias y perfiles, criterios de recomendación y de priorización, y criterios de pertinencia. Las respuestas alimentan la matriz de variables y trazabilidad (F1-04) y, a través de ella, los requisitos del artefacto.'),
  h1('2. Ajustes respecto al borrador del anteproyecto'),
  bullets([
    'Se mantienen las 10 dimensiones (A–J) y las 12 preguntas del Anexo A; se agregan 7 preguntas de precisión (A3, C2, C3, D2, E2, G1, J2), para un total de 19, para cubrir las variables que el anteproyecto mide: índice de completitud, intereses del perfil, priorización básica, tasa de aceptación y valor de K.',
    'Cada pregunta indica la **variable o elemento** que alimenta, para codificar las respuestas sin ambigüedad.',
    'Se quitan los criterios académicos sensibles como obligatorios (promedio): se preguntan, pero la plataforma no los almacena (Ley 1581 de 2012, principio de finalidad).',
  ]),
  h1('3. Protocolo de aplicación'),
  numbered([
    'Duración estimada: 40 a 50 minutos, presencial o por videollamada.',
    'Leer el objetivo, entregar el consentimiento informado (F1-02) y confirmar la autorización de grabación de audio.',
    'Aplicar las preguntas en el orden del formato, sin sugerir respuestas. Las listas de opciones se leen solo después de la respuesta espontánea.',
    'Registrar observaciones en la columna «Notas» durante la entrevista.',
    'Transcribir la entrevista en máximo 5 días hábiles y anonimizarla con el código del participante (E01, E02…).',
    'Codificar las respuestas por dimensión (codificación temática) y registrar los hallazgos en la matriz F1-04.',
  ]),
  h1('4. Datos de la entrevista'),
  ficha([
    ['Código del participante', 'E___'],
    ['Fecha y hora', ''],
    ['Modalidad', '☐ Presencial   ☐ Virtual'],
    ['Entrevistador', ''],
    ['Consentimiento firmado', '☐ Sí   ☐ No (no aplicar)'],
    ['Grabación autorizada', '☐ Sí   ☐ No'],
  ]),
  pageBreak(),
  h1('5. Preguntas'),
];
for (const [dimension, items] of QUESTIONS) {
  children.push(h2(`Dimensión ${dimension}`));
  children.push(table(['N.°', 'Pregunta', 'Variable / elemento', 'Notas del entrevistador'], items.map(([n, q, v]) => [n, q, v, '']), [6, 52, 18, 24], { minHeight: 900 }));
  children.push(spacer());
}
children.push(
  h1('6. Cierre'),
  p('Agradecer la participación, preguntar si desea agregar algo y recordar que puede retirarse del estudio en cualquier momento sin consecuencias (consentimiento F1-02).'),
  h1('7. Control de cambios del instrumento'),
  table(['Versión', 'Fecha', 'Cambio', 'Origen (experto o prueba piloto)'], [['1.0', '02/11/2026', 'Versión final a partir del Anexo A del anteproyecto.', 'Autores'], ['', '', '', ''], ['', '', '', '']], [12, 15, 48, 25], { minHeight: 500 }),
);

build('F1-01 Entrevista estructurada.docx', 'F1-01', children);
