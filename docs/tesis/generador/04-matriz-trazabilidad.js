const { useLandscape, build, cover, h1, h2, p, bullets, note, table, spacer } = require('./lib');
useLandscape();

// Fase 1 DSR: matriz de variables y matriz de trazabilidad
// Categoría → Variable → Indicador → Pregunta → Fuente → Requisito.

const VARIABLES = [
  ['Competencias del estudiante', 'Conocimientos, competencias técnicas y blandas, experiencia, intereses y disponibilidad que una persona declara en su perfil.', 'Correspondencia entre el perfil y los requisitos de un perfil requerido, calculada por el puntaje híbrido (0–100).', '% de correspondencia (puntaje de Conecta U)', '100·(0,5·S + 0,2·M + 0,15·E + 0,15·A); ver documento F2-01', 'Plataforma (cálculo); entrevista D1–D2, E1', 'Razón 0–100'],
  ['Caracterización de necesidades', 'Grado en que una necesidad escrita en lenguaje natural contiene la información para convertirla en una oportunidad.', 'Elementos presentes tras la caracterización con IA y lo declarado por el formulador, ponderados.', 'Índice de completitud (0–100)', 'Σ pesos de los elementos presentes / 100 (problema 20, objetivo 20, beneficiarios 15, resultados 15, competencias 15, plazo 10, dependencia 5)', 'Plataforma; entrevista C1–C2; juicio de expertos (pesos)', 'Razón 0–100'],
  ['Priorización de necesidades', 'Orden de atención de las necesidades según su urgencia, impacto y claridad (priorización básica).', 'Puntaje que combina urgencia e impacto declarados (1–5) y la completitud.', 'Puntaje de prioridad (0–100) y nivel ALTA/MEDIA/BAJA', '100·(0,4·impacto/5 + 0,4·urgencia/5 + 0,2·completitud/100); ALTA ≥ 70, MEDIA ≥ 40', 'Plataforma; entrevista G1', 'Razón 0–100; ordinal'],
  ['Precisión de la recomendación', 'Capacidad del recomendador para ubicar perfiles pertinentes en los primeros K lugares.', 'Métricas @K contra la pertinencia dada por la rúbrica (expertos y formuladores), con K = 5 y 10.', 'Precision@K, Recall@K, HitRate@K, NDCG@K, cobertura de competencias@K', 'Ver F2-01 §6 y F4-04', 'Casos de prueba; rúbrica F4-01; plataforma', 'Razón 0–1'],
  ['Aceptación de la recomendación', 'Percepción de utilidad de las recomendaciones para quien formula la necesidad.', 'Decisiones Aceptar / Descartar que registran los líderes sobre las personas recomendadas.', 'Tasa de aceptación', 'aceptadas / (aceptadas + descartadas)', 'Plataforma (registro de decisiones); entrevista J2', 'Razón 0–1'],
  ['Usabilidad de la plataforma', 'Facilidad de uso, comprensión y aprendizaje percibidas por los usuarios del piloto.', 'Puntaje del cuestionario System Usability Scale.', 'Puntaje SUS (0–100)', '2,5·[Σ(impares − 1) + Σ(5 − pares)]', 'Cuestionario SUS F4-02', 'Intervalo 0–100'],
];

const TRACE = [
  ['Competencias', 'Competencias del estudiante', '% de correspondencia', 'D1, D2, E1, F1', 'Docentes, líderes de semillero, estudiantes', 'Representar conocimientos, competencias, experiencia, intereses y disponibilidad de cada persona y compararlos con los perfiles requeridos.', 'RF3, RF4, RF5, RF11 · T6'],
  ['Necesidades', 'Caracterización de necesidades', 'Índice de completitud', 'B1, B2, C1, C2, C3, G2', 'Dependencias, docentes formuladores; documentos D01, D02, D07', 'Registrar una necesidad en lenguaje natural, caracterizarla con IA (problema, objetivo, beneficiarios, resultados, competencias, tipo sugerido, faltantes) y calcular su completitud.', 'T1, T2, T3'],
  ['Necesidades', 'Priorización de necesidades', 'Puntaje de prioridad', 'G1, I1', 'Formuladores, coordinadores', 'Ordenar las necesidades por prioridad básica (urgencia, impacto, completitud).', 'T4'],
  ['Necesidades', 'Caracterización de necesidades', 'Estados de la necesidad', 'I1', 'Formuladores', 'Llevar la necesidad por REGISTRADA → CARACTERIZADA → CONVERTIDA / DESCARTADA y convertirla en una oportunidad (proyecto).', 'T1, T5 · RF6'],
  ['Recomendación', 'Precisión de la recomendación', 'Precision@K, Recall@K, HitRate@K, NDCG@K, cobertura', 'E1, E2, J1', 'Formuladores y docentes expertos (rúbrica F4-01)', 'Generar un ranking de personas por perfil requerido con su % de correspondencia y su justificación.', 'RF8–RF13 · T8, T9'],
  ['Recomendación', 'Aceptación de la recomendación', 'Tasa de aceptación', 'J2', 'Líderes que usan la plataforma en el piloto', 'Registrar la decisión de aceptar o descartar a cada persona recomendada y consolidar la tasa de aceptación.', 'T7 · RF15'],
  ['Usabilidad', 'Usabilidad de la plataforma', 'Puntaje SUS', '(cuestionario SUS)', 'Estudiantes, docentes y administradores del piloto', 'Ofrecer una interfaz comprensible y fácil de usar para los tres actores.', 'RNF1, RNF2 · T10'],
  ['Restricciones', 'Competencias del estudiante', '(regla de negocio)', 'H1', 'Docentes, coordinadores', 'Validar autorización de datos, veracidad de la información, horas disponibles y límites de cada registro.', 'RF1, RF3, RF5 · RNF5'],
];

// Requisitos del seminario (RF v2.2) como requisitos derivados de la tesis, citando su origen.
const DERIVED = [
  ['RF1', 'Registrar usuarios, asignar rol y vincular la cuenta con una persona', 'Soporte: actores del piloto (formulador = Líder; estudiante/docente = Colaborador)'],
  ['RF2', 'Iniciar sesión con credenciales', 'Soporte'],
  ['RF3', 'Perfil técnico: conocimientos, competencias técnicas y blandas con nivel y experiencia', 'Núcleo: variable «competencias del estudiante»'],
  ['RF4', 'Experiencia (tipo, rol, fechas, dedicación, tecnologías) y certificado', 'Núcleo: componente experiencia del puntaje'],
  ['RF5', 'Disponibilidad (estado y horas por semana)', 'Núcleo: componente disponibilidad del puntaje'],
  ['RF6–RF7', 'Registrar, consultar y actualizar proyectos con plantilla por tipo', 'Núcleo: la oportunidad es un proyecto (T5)'],
  ['RF8–RF10', 'Análisis con IA: perfiles requeridos y justificación', 'Núcleo: requerimientos de la oportunidad'],
  ['RF11–RF13', 'Comparar perfiles con personas, lista recomendada y «¿Por qué?»', 'Núcleo: recomendación con % de correspondencia'],
  ['RF14', 'Gestionar cuentas de usuario', 'Soporte: administración del piloto'],
  ['RF15–RF16', 'Dashboard y reportes', 'Soporte: indicadores del piloto (tasa de aceptación, T7)'],
  ['RF17', 'Gestionar personas sin usuario', 'Soporte: carga de participantes'],
  ['RF18', 'Gestionar catálogos y plantillas', 'Soporte: catálogo de competencias'],
  ['RF19–RF20', 'Importar colaboradores desde Excel', 'Soporte: carga de los perfiles del piloto'],
  ['RF21–RF22', 'Convocatoria por correo e historial', 'Soporte: notificación simple (fuera del alcance de la tesis la comunicación avanzada)'],
];

const TESIS = [
  ['T1', 'Registrar necesidades institucionales en lenguaje natural (7 tipos, urgencia e impacto 1–5, plazo, dependencia)', 'Objetivo específico 3; flujo Necesidad → Caracterización'],
  ['T2', 'Caracterizar la necesidad con IA y emparejar las competencias con el catálogo', 'Objetivo específico 2; variable caracterización'],
  ['T3', 'Calcular el índice de completitud y los elementos faltantes', 'Variable caracterización de necesidades'],
  ['T4', 'Calcular la prioridad básica y ordenar la lista', 'Objetivo general (priorización); alcance excluye la avanzada'],
  ['T5', 'Convertir la necesidad en oportunidad (proyecto)', 'Flujo Caracterización → Oportunidad'],
  ['T6', 'Registrar intereses en el perfil', 'Alcance: perfil con competencias, intereses y experiencia'],
  ['T7', 'Aceptar o descartar recomendaciones; tasa de aceptación', 'Indicador complementario de la variable recomendación'],
  ['T8–T9', 'Métricas @K y evaluación offline con datos sintéticos', 'Objetivo específico 4 (preliminar, marcado como simulación)'],
  ['T10', 'Interfaces de necesidades, intereses, decisiones y evaluación', 'Objetivo específico 3; usabilidad'],
];

const children = [
  ...cover({
    code: 'F1-04',
    title: 'Matriz de variables y matriz de trazabilidad',
    subtitle: 'Categoría → Variable → Indicador → Pregunta → Fuente → Requisito derivado',
    phase: 'Fase 1 – Identificación del problema · Fase 2 – Objetivos de la solución',
  }),
  note('Los indicadores, pesos y fórmulas de esta versión son **propuestas** de los autores: se validan con el juicio de expertos (F1-05) y con los hallazgos de las entrevistas (F1-01) y la revisión documental (F1-03). Los cambios se registran en una nueva versión de esta matriz.', 'F2F2F2'),
  h1('1. Matriz de variables'),
  table(['Variable', 'Definición conceptual', 'Definición operacional', 'Indicador', 'Cálculo', 'Instrumento / fuente', 'Escala'], VARIABLES, [13, 20, 20, 13, 17, 11, 6], { size: 16 }),
  spacer(),
  h1('2. Matriz de trazabilidad'),
  p('Las preguntas remiten a la entrevista F1-01. La última columna enlaza cada requisito con los requerimientos del seminario (RF v2.2) o con las tareas de la extensión de tesis (T1–T10).'),
  table(['Categoría', 'Variable', 'Indicador', 'Pregunta', 'Fuente', 'Requisito derivado', 'Implementación'], TRACE, [9, 14, 13, 9, 16, 27, 12], { size: 16 }),
  spacer(),
  h1('3. Requisitos derivados'),
  h2('3.1 Del Seminario Integrador III (RF v2.2)'),
  p('El artefacto reutiliza el código del seminario. Sus requerimientos entran a la tesis como **requisitos derivados**, citando su origen: «Planificación Alcance Global v2.2» y «Acta de aprobación de RF v2.2» del Seminario Integrador III. Se distingue entre los que forman el núcleo del flujo de la tesis y los de soporte (D9 de la dualidad seminario–tesis).'),
  table(['RF (origen: seminario v2.2)', 'Descripción', 'Papel en la tesis'], DERIVED, [12, 48, 40], { size: 17 }),
  spacer(),
  h2('3.2 De la extensión de tesis (rama de tesis)'),
  table(['Código', 'Requisito', 'Origen en el anteproyecto'], TESIS, [10, 55, 35], { size: 17 }),
  spacer(),
  h1('4. Control de versiones'),
  table(['Versión', 'Fecha', 'Cambio', 'Origen'], [['1.0', '02/11/2026', 'Versión inicial a partir del anteproyecto y del artefacto implementado.', 'Autores'], ['', '', '', '']], [10, 12, 58, 20], { minHeight: 420 }),
];

build('F1-04 Matriz de variables y trazabilidad.docx', 'F1-04', children, { landscape: true });
