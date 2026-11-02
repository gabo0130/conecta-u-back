const { build, cover, h1, h2, p, bullets, numbered, note, table, spacer, pageBreak } = require('./lib');

// Fase 4 DSR: protocolo del escenario piloto controlado.
const TASKS = [
  ['F1', 'Formulador', 'Registrar una necesidad de su dependencia o programa con sus palabras.', 'La necesidad queda REGISTRADA con tipo, urgencia e impacto.', '5 min'],
  ['F2', 'Formulador', 'Caracterizarla con IA, revisar lo que falta y completar plazo o dependencia.', 'Estado CARACTERIZADA; completitud visible.', '5 min'],
  ['F3', 'Formulador', 'Convertirla en oportunidad: revisar el formulario precargado, completarlo y guardarlo.', 'Proyecto creado y necesidad CONVERTIDA.', '8 min'],
  ['F4', 'Formulador', 'Analizar el proyecto con IA y revisar los perfiles requeridos.', 'Análisis completado con 2 a 5 perfiles.', '4 min'],
  ['F5', 'Formulador', 'Generar recomendaciones, abrir «¿Por qué?» de al menos dos personas y aceptar o descartar a las 5 primeras de un perfil.', '≥ 5 decisiones registradas.', '8 min'],
  ['E1', 'Estudiante / docente', 'Iniciar sesión y completar «Mi perfil»: competencias con nivel y meses, una experiencia, intereses y disponibilidad.', 'Perfil con ≥ 3 competencias, ≥ 1 experiencia e intereses.', '12 min'],
  ['E2', 'Estudiante / docente', 'Cambiar la disponibilidad y verificar que se guardó.', 'Disponibilidad actualizada.', '2 min'],
  ['A1', 'Administrador', 'Consultar el dashboard, la tarjeta de evaluación y la lista de todas las necesidades ordenada por prioridad.', 'Encuentra la tasa de aceptación y la necesidad de mayor prioridad.', '5 min'],
];

const children = [
  ...cover({
    code: 'F4-03',
    title: 'Protocolo del escenario piloto',
    subtitle: 'Evaluación del funcionamiento, la pertinencia de las recomendaciones y la usabilidad de Conecta U',
    phase: 'Fase 4 – Demostración y evaluación',
  }),
  note('Los resultados del piloto **solo** se registran cuando el piloto ocurra, con los datos de los participantes reales. Los resultados con datos sintéticos (F4-04) son una simulación y no se mezclan con estos.'),
  h1('1. Objetivo'),
  p('Evaluar en un escenario controlado (anteproyecto §3.3.3): (a) el funcionamiento del flujo Necesidad → Caracterización → Oportunidad → Recomendación, (b) la pertinencia de los perfiles recomendados (métricas @K con la rúbrica F4-01 y tasa de aceptación) y (c) la usabilidad (SUS, F4-02).'),
  h1('2. Participantes'),
  p('Muestra **no probabilística intencional** del Programa de Ingeniería de Sistemas, con los criterios de inclusión y exclusión del anteproyecto (§3.3.4–3.3.5). Metas orientativas, que se ajustan a la disponibilidad real y se reportan tal como resulten:'),
  table(['Rol en el piloto', 'Rol en la plataforma', 'Meta orientativa', 'Qué aporta'], [
    ['Formuladores (docentes, líderes de semillero, representantes de dependencias)', 'Líder', '3 a 5 personas, cada una con 1 o 2 necesidades', 'Necesidades reales, decisiones de aceptación, valoración con la rúbrica'],
    ['Estudiantes y docentes con perfil', 'Colaborador', '15 a 30 personas', 'Perfiles reales sobre los que se recomienda; SUS'],
    ['Docentes expertos (evaluadores)', '—', '2 o 3 (pueden ser los del juicio de expertos)', 'Segunda valoración con la rúbrica F4-01'],
    ['Administrador', 'Admin', '1', 'Gestión del piloto; SUS'],
  ], [32, 14, 24, 30]),
  spacer(),
  h1('3. Preparación'),
  numbered([
    'Juicio de expertos aplicado y ajustes incorporados a la entrevista, la rúbrica y los pesos (F1-05).',
    'Entorno del piloto desplegado (frontend, backend, base de datos) con la rama de tesis y **sin datos sintéticos**: se usa una base propia del piloto. Proveedor de IA real (Gemini); se registra si en algún momento se usó el proveedor de respaldo.',
    'Consentimiento informado (F1-02) firmado por cada participante antes de crear su cuenta.',
    'Cuentas creadas: formuladores con rol Líder; estudiantes y docentes con rol Colaborador (por registro o por importación Excel).',
    'Prueba en seco del recorrido completo con un participante no incluido en la muestra.',
  ]),
  h1('4. Desarrollo de las sesiones'),
  h2('4.1 Sesión de perfiles (estudiantes y docentes) – 30 minutos'),
  bullets(['Bienvenida y consentimiento (5 min).', 'Tareas E1 y E2 (15 min).', 'SUS y comentarios (10 min).']),
  h2('4.2 Sesión de formuladores – 60 minutos (después de la de perfiles)'),
  bullets(['Bienvenida y consentimiento (5 min).', 'Tareas F1 a F5 (30 min).', 'Valoración con la rúbrica F4-01 de su propio caso (15 min).', 'SUS y comentarios (10 min).']),
  h2('4.3 Tareas'),
  p('El facilitador lee la tarea y no ayuda salvo bloqueo de más de 2 minutos (se registra como «con ayuda»). El observador registra tiempo, éxito y errores.'),
  table(['Cód.', 'Rol', 'Tarea', 'Criterio de éxito', 'Tiempo máx.'], TASKS, [7, 14, 43, 26, 10], { size: 17 }),
  spacer(),
  h1('5. Datos que se recogen'),
  table(['Dato', 'Fuente', 'Indicador'], [
    ['Éxito, tiempo y errores por tarea', 'Hoja de registro (sección 7)', 'Tasa de éxito por tarea; tiempo medio'],
    ['Completitud y prioridad de cada necesidad', 'Plataforma', 'Índice de completitud (antes y después de completar)'],
    ['Decisiones Aceptar / Descartar', 'Plataforma (GET /admin/evaluation y reporte)', 'Tasa de aceptación global y por proyecto'],
    ['Pertinencia de las 10 primeras recomendaciones por perfil', 'Rúbrica F4-01 (dos evaluadores)', 'Precision@K, Recall@K, HitRate@K, NDCG@K, cobertura (K = 5 y 10); kappa'],
    ['Usabilidad', 'SUS (F4-02) y hoja de cálculo', 'Puntaje SUS por rol'],
    ['Comentarios', 'SUS y observación', 'Hallazgos cualitativos para la Fase 5'],
  ], [34, 33, 33]),
  spacer(),
  h1('6. Roles y contingencias'),
  bullets([
    '**Facilitador:** Walter Steven Casadiegos Quintero. **Observador y soporte técnico:** Jhony Gabriel Quintero Gómez.',
    'Si el servicio de IA no está disponible, se reprograma la tarea o, si se usa el proveedor de respaldo, se anota en el registro y esos casos se analizan aparte (no son comparables).',
    'Si un participante retira el consentimiento, sus datos se eliminan de la plataforma (incluye su vector, recomendaciones y decisiones) y no se usan en el análisis.',
  ]),
  pageBreak(),
  h1('7. Hoja de registro de tareas'),
  table(null, [['Participante (código)', ''], ['Rol', ''], ['Fecha y sesión', ''], ['Observador', '']], [30, 70], { minHeight: 400 }),
  spacer(),
  table(['Tarea', 'Inicio', 'Fin', 'Resultado', 'Errores / bloqueos', 'Observaciones'], TASKS.map(([code]) => [code, '', '', '☐ Éxito ☐ Con ayuda ☐ No completó', '', '']), [8, 9, 9, 24, 22, 28], { size: 16, minHeight: 520 }),
];

build('F4-03 Protocolo del piloto.docx', 'F4-03', children);
