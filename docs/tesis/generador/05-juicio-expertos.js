const { useLandscape, build, cover, h1, h2, p, bullets, numbered, note, table, spacer, pageBreak } = require('./lib');
useLandscape();

// Fases 1–4 DSR: formato de validación de contenido por juicio de expertos (3 expertos).
const fs = require('fs');
// Mismas preguntas que la entrevista F1-01 (una sola fuente).
const QUESTIONS = new Function(fs.readFileSync(__dirname + '/01-entrevista.js', 'utf8').match(/const QUESTIONS = (\[[\s\S]*?\n\]);/)[1].replace(/^/, 'return '))();

const RUBRIC_ITEMS = [
  ['R1', 'Nivel 2 – Muy pertinente: la persona cumple las competencias de importancia alta con el nivel mínimo pedido y tiene experiencia relacionada.'],
  ['R2', 'Nivel 1 – Pertinente: cumple parte de las competencias de importancia alta o las cumple con un nivel menor; podría aportar con acompañamiento.'],
  ['R3', 'Nivel 0 – No pertinente: no cumple las competencias de importancia alta o su perfil corresponde a otra área.'],
  ['R4', 'Criterio complementario: la disponibilidad declarada alcanza las horas mínimas del perfil.'],
  ['R5', 'Criterio complementario: los intereses de la persona son afines al tema de la necesidad.'],
];

const WEIGHTS = [
  ['Índice de completitud', 'Problema', '20'], ['', 'Objetivo', '20'], ['', 'Beneficiarios', '15'], ['', 'Resultados esperados', '15'],
  ['', 'Competencias requeridas', '15'], ['', 'Plazo esperado', '10'], ['', 'Dependencia que la plantea', '5'],
  ['Prioridad básica', 'Impacto', '40 %'], ['', 'Urgencia', '40 %'], ['', 'Completitud', '20 %'],
  ['Puntaje de recomendación', 'Habilidades', '50 %'], ['', 'Similitud semántica', '20 %'], ['', 'Experiencia relevante', '15 %'], ['', 'Disponibilidad', '15 %'],
];

// Escala 1–4 de la tabla 1.
const criteriaHeaders = ['CLA', 'PER', 'COH', 'SUF', 'Observaciones'];
const blank = ['', '', '', '', ''];

const children = [
  ...cover({
    code: 'F1-05',
    title: 'Formato de juicio de expertos',
    subtitle: 'Validación de contenido de la entrevista estructurada, la rúbrica de pertinencia y los pesos del modelo',
    phase: 'Fases 1 a 4 – Validación de instrumentos y del diseño',
  }),
  h1('1. Presentación'),
  p('Abreviaturas de las tablas: **CLA** claridad, **PER** pertinencia, **COH** coherencia, **SUF** suficiencia; cada una se califica de 1 a 4.'),
  p('Usted ha sido invitado(a) como experto(a) para valorar los instrumentos del trabajo de grado Conecta U. Le pedimos calificar cada ítem según los cuatro criterios de la tabla 1 y anotar las observaciones que considere. Se diligencia **una copia por experto**; los autores consolidan las tres valoraciones.'),
  table(['Criterio', 'Pregunta guía', '1', '2', '3', '4'], [
    ['Claridad', '¿El ítem se entiende con facilidad; su redacción es precisa?', 'No cumple', 'Bajo nivel', 'Moderado', 'Alto nivel'],
    ['Pertinencia', '¿El ítem corresponde a la variable o dimensión que dice medir?', 'No cumple', 'Bajo nivel', 'Moderado', 'Alto nivel'],
    ['Coherencia', '¿El ítem guarda relación lógica con el objetivo y con los demás ítems?', 'No cumple', 'Bajo nivel', 'Moderado', 'Alto nivel'],
    ['Suficiencia', '¿Los ítems de la dimensión bastan para medirla? (se valora por dimensión)', 'No cumple', 'Bajo nivel', 'Moderado', 'Alto nivel'],
  ], [12, 44, 11, 11, 11, 11]),
  spacer(),
  h1('2. Datos del experto'),
  table(null, [['Nombre', ''], ['Formación (pregrado y posgrado)', ''], ['Cargo e institución', ''], ['Años de experiencia en proyectos o investigación', ''], ['Área de experticia', ''], ['Fecha de la valoración', ''], ['Firma', '']], [30, 70], { minHeight: 460 }),
  note('Criterios de selección de los expertos (anteproyecto §3.4): formación en ingeniería de sistemas, investigación, educación superior, gestión de proyectos o afines; experiencia en formulación, gestión, evaluación o desarrollo de proyectos universitarios; disponibilidad para revisar los instrumentos.', 'F2F2F2'),
  pageBreak(),
  h1('3. Entrevista estructurada (F1-01)'),
];
for (const [dimension, items] of QUESTIONS) {
  children.push(h2(`Dimensión ${dimension}`));
  children.push(table(['N.°', 'Ítem', ...criteriaHeaders], items.map(([n, q]) => [n, q, ...blank]), [5, 40, 8, 8, 8, 8, 23], { size: 16, minHeight: 600 }));
}
children.push(
  pageBreak(),
  h1('4. Rúbrica de pertinencia de perfiles (F4-01)'),
  table(['N.°', 'Nivel o criterio', ...criteriaHeaders], RUBRIC_ITEMS.map(([n, q]) => [n, q, ...blank]), [5, 40, 8, 8, 8, 8, 23], { size: 16, minHeight: 600 }),
  spacer(),
  h1('5. Pesos propuestos del modelo'),
  p('Indique si está de acuerdo con cada peso y, si no, cuál propone. Los pesos se usan en el índice de completitud, en la prioridad básica y en el puntaje de recomendación (documento F2-01).'),
  table(['Componente', 'Elemento', 'Peso propuesto', 'De acuerdo (Sí/No)', 'Peso que propone', 'Justificación'], WEIGHTS.map((row) => [...row, '', '', '']), [18, 22, 11, 11, 11, 27], { size: 17, minHeight: 380 }),
  spacer(),
  h1('6. Valoración global'),
  table(['Aspecto', 'Valoración'], [['¿El instrumento permite cumplir el objetivo para el que fue diseñado?', '☐ Sí   ☐ Sí, con ajustes   ☐ No'], ['¿Qué ítems agregaría o eliminaría?', ''], ['Concepto final', '☐ Aplicable   ☐ Aplicable con ajustes   ☐ No aplicable']], [45, 55], { minHeight: 560 }),
  pageBreak(),
  h1('7. Consolidación (la diligencian los autores)'),
  p('Para cada ítem y criterio se calcula el coeficiente V de Aiken con las tres valoraciones:'),
  p('**V = S / [n · (c − 1)]**, donde S es la suma de (valoración − 1) de los expertos, n = 3 expertos y c = 4 categorías de la escala. V va de 0 a 1.'),
  bullets([
    'Criterio de decisión propuesto: se conserva el ítem con V ≥ 0,70 en los cuatro criterios; entre 0,50 y 0,69 se ajusta según las observaciones; por debajo de 0,50 se reformula o se elimina. El umbral se documenta en el informe como decisión metodológica.',
    'Los pesos de la sección 5 se ajustan si al menos dos expertos proponen un cambio en el mismo sentido; el nuevo valor se registra en la matriz F1-04 y en el código (`NEED_COMPLETENESS_WEIGHTS`, `NEED_PRIORITY_WEIGHTS`, `MATCH_WEIGHTS`).',
  ]),
  table(['Ítem', 'Criterio', 'Experto 1', 'Experto 2', 'Experto 3', 'S', 'V de Aiken', 'Decisión'], [['A1', 'Claridad', '', '', '', '', '', ''], ...Array.from({ length: 8 }, () => Array(8).fill(''))], [8, 14, 10, 10, 10, 8, 12, 28], { minHeight: 380 }),
);

build('F1-05 Formato de juicio de expertos.docx', 'F1-05', children, { landscape: true });
