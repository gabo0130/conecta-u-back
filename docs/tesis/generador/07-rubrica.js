const { useLandscape, build, cover, h1, h2, p, bullets, numbered, note, table, spacer, pageBreak } = require('./lib');
useLandscape();

// Fase 4 DSR: rúbrica de pertinencia de los perfiles recomendados (relevancia graduada 0–2).
const children = [
  ...cover({
    code: 'F4-01',
    title: 'Rúbrica de pertinencia de perfiles recomendados',
    subtitle: 'Base de la relevancia graduada para Precision@K, Recall@K, HitRate@K y NDCG@K',
    phase: 'Fase 4 – Demostración y evaluación',
  }),
  note('Esta rúbrica se valida con el juicio de expertos (F1-05, sección 4) antes de aplicarla. La aplican formuladores y docentes expertos sobre casos reales del piloto; no se completa con datos sintéticos.', 'F2F2F2'),
  h1('1. Niveles de pertinencia'),
  table(['Nivel', 'Nombre', 'Descriptor', 'Valor para las métricas'], [
    ['2', 'Muy pertinente', 'Cumple todas las competencias de importancia alta del perfil con el nivel mínimo pedido y tiene experiencia relacionada con la necesidad. Lo invitaría sin dudar.', 'rel = 2 (pertinente para P@K, R@K y HR@K)'],
    ['1', 'Pertinente', 'Cumple parte de las competencias de importancia alta, o todas con un nivel menor al pedido; podría aportar con acompañamiento.', 'rel = 1 (pertinente)'],
    ['0', 'No pertinente', 'No cumple las competencias de importancia alta o su perfil corresponde a otra área.', 'rel = 0'],
  ], [7, 15, 55, 23]),
  spacer(),
  h2('1.1 Criterios de apoyo'),
  table(['Criterio', 'Pregunta para el evaluador', 'Efecto sobre el nivel'], [
    ['Competencias de importancia alta', '¿Tiene las competencias que el perfil marca como de importancia alta, con el nivel mínimo?', 'Define el nivel base (2, 1 o 0).'],
    ['Experiencia relacionada', '¿Ha usado esas competencias en experiencias (laborales, prácticas, proyectos, semilleros)?', 'Sin experiencia relacionada, un 2 baja a 1.'],
    ['Disponibilidad', '¿Sus horas por semana alcanzan las que pide el perfil?', 'Se anota; no cambia el nivel (se valora aparte para no mezclar pertinencia y disponibilidad).'],
    ['Intereses', '¿Sus intereses son afines al tema de la necesidad?', 'Desempate entre 1 y 2 cuando el evaluador duda.'],
  ], [20, 45, 35]),
  spacer(),
  h1('2. Procedimiento'),
  numbered([
    'Por cada caso (perfil requerido de una oportunidad del piloto) se toman las **10 primeras personas** que recomendó la plataforma.',
    'La lista se entrega al evaluador **en orden aleatorio, sin puntaje ni posición** (evaluación ciega), con el perfil requerido y la información de cada persona que ve el líder (sin datos de contacto).',
    'Cada caso lo valoran **al menos dos evaluadores** (el formulador de la necesidad y un docente experto) de forma independiente.',
    'Nivel final: con tres o más evaluadores, la **mediana**. Con dos: si coinciden, ese nivel; si difieren en uno, el **menor** (criterio conservador); si difieren en dos (0 y 2), se discute el caso y se registra el acuerdo.',
    'Se calcula el acuerdo entre evaluadores con el **kappa ponderado de Cohen** (o Fleiss si hay tres o más) y se reporta junto con las métricas.',
    'Con los niveles finales se calculan Precision@K, Recall@K, HitRate@K y NDCG@K para K = 5 y 10 (F2-01 §7). Recall usa como total de pertinentes los que identifiquen los evaluadores en la lista evaluada.',
  ]),
  pageBreak(),
  h1('3. Formato de valoración (un formato por caso y evaluador)'),
  table(null, [['Caso (necesidad / perfil)', ''], ['Competencias de importancia alta del perfil', ''], ['Evaluador (código)', ''], ['Rol del evaluador', '☐ Formulador   ☐ Docente experto'], ['Fecha', '']], [30, 70], { minHeight: 420 }),
  spacer(),
  table(['Código de la persona', 'Competencias de importancia alta', 'Experiencia relacionada', 'Disponibilidad suficiente', 'Intereses afines', 'Nivel (0 / 1 / 2)', 'Observación'],
    Array.from({ length: 10 }, (_, i) => [`R${String(i + 1).padStart(2, '0')}`, '☐ Todas ☐ Parte ☐ Ninguna', '☐ Sí ☐ No', '☐ Sí ☐ No', '☐ Sí ☐ No', '', '']),
    [10, 20, 13, 13, 11, 10, 23], { size: 16, minHeight: 480 }),
];

build('F4-01 Rubrica de pertinencia.docx', 'F4-01', children, { landscape: true });
