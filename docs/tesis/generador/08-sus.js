const { build, cover, h1, p, bullets, numbered, note, table, spacer, pageBreak } = require('./lib');

// Fase 4 DSR: cuestionario SUS en español (Brooke, 1996), con instrucciones de puntaje.
const ITEMS = [
  'Creo que me gustaría usar esta plataforma con frecuencia.',
  'Encontré la plataforma innecesariamente compleja.',
  'Pensé que la plataforma era fácil de usar.',
  'Creo que necesitaría el apoyo de una persona con conocimientos técnicos para poder usar esta plataforma.',
  'Encontré que las distintas funciones de la plataforma estaban bien integradas.',
  'Pensé que había demasiada inconsistencia en la plataforma.',
  'Imagino que la mayoría de las personas aprendería a usar esta plataforma muy rápidamente.',
  'Encontré la plataforma muy engorrosa de usar.',
  'Me sentí muy seguro(a) usando la plataforma.',
  'Necesité aprender muchas cosas antes de poder empezar a usar esta plataforma.',
];

const children = [
  ...cover({
    code: 'F4-02',
    title: 'Cuestionario de usabilidad SUS',
    subtitle: 'System Usability Scale (Brooke, 1996) – versión en español para el piloto de Conecta U',
    phase: 'Fase 4 – Demostración y evaluación',
    extra: [['Hoja de cálculo', 'F4-02 Puntaje SUS.xlsx (calcula el puntaje por participante y el resumen)']],
  }),
  note('Se aplica **al terminar las tareas del piloto** (F4-03), antes de cualquier conversación sobre la plataforma. Las 10 afirmaciones se responden todas; si alguien no está seguro, marca el punto medio (3). La redacción es una adaptación al español del SUS original; «sistema» se reemplazó por «plataforma».'),
  table(null, [['Código del participante', 'P___'], ['Rol en el piloto', '☐ Formulador (Líder)   ☐ Estudiante   ☐ Docente   ☐ Administrador'], ['Fecha', '']], [30, 70], { minHeight: 420 }),
  spacer(),
  h1('Cuestionario'),
  p('Marque con una X qué tan de acuerdo está con cada afirmación (1 = totalmente en desacuerdo, 5 = totalmente de acuerdo).'),
  table(['N.°', 'Afirmación', '1', '2', '3', '4', '5'], ITEMS.map((item, i) => [String(i + 1), item, '☐', '☐', '☐', '☐', '☐']), [6, 64, 6, 6, 6, 6, 6], { minHeight: 520 }),
  spacer(),
  table(null, [['Comentarios (opcional): ¿qué fue lo más fácil y lo más difícil?', '']], [35, 65], { minHeight: 1200 }),
  pageBreak(),
  h1('Cálculo del puntaje (lo hacen los investigadores)'),
  numbered([
    'Ítems impares (1, 3, 5, 7, 9): aporte = respuesta − 1.',
    'Ítems pares (2, 4, 6, 8, 10): aporte = 5 − respuesta.',
    'Puntaje SUS = 2,5 × (suma de los 10 aportes). Va de 0 a 100. No es un porcentaje.',
  ]),
  p('Ejemplo: respuestas 4, 2, 4, 1, 4, 2, 5, 2, 4, 2 → impares (3 + 3 + 3 + 4 + 3) = 16; pares (3 + 4 + 3 + 3 + 3) = 16; SUS = 2,5 × 32 = **80**.'),
  h1('Interpretación'),
  table(['Rango SUS', 'Lectura (referencia)'], [
    ['≥ 85', 'Excelente'], ['71 – 84', 'Buena'], ['68 – 70', 'Alrededor del promedio de referencia (68)'], ['51 – 67', 'Aceptable con problemas (marginal)'], ['≤ 50', 'Pobre: hay problemas de usabilidad importantes'],
  ], [25, 75]),
  p('Referencias de interpretación: promedio de 68 (Sauro, 2011) y escala de adjetivos de Bangor, Kortum y Miller (2009). En el informe se reportan n, media, desviación estándar, mediana, mínimo y máximo, en total y por rol; con muestras pequeñas se prefiere la mediana y se informa el intervalo de confianza de la media.'),
  bullets(['Brooke, J. (1996). SUS: A “quick and dirty” usability scale. En P. W. Jordan et al. (Eds.), _Usability Evaluation in Industry_ (pp. 189–194). Taylor & Francis.', 'Bangor, A., Kortum, P., & Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. _Journal of Usability Studies, 4_(3), 114–123.', 'Sauro, J. (2011). _A practical guide to the System Usability Scale_. Measuring Usability LLC.']),
];

build('F4-02 Cuestionario SUS.docx', 'F4-02', children);
