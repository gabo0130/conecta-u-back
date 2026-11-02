const { build, cover, h1, p, bullets, note, table, spacer } = require('./lib');

// Fase 1 DSR: consentimiento informado para entrevistas y piloto.
const children = [
  ...cover({
    code: 'F1-02',
    title: 'Consentimiento informado',
    subtitle: 'Participación en entrevistas, pruebas del piloto y cuestionarios del trabajo de grado',
    phase: 'Fases 1 y 4 – Caracterización y evaluación',
  }),
  h1('1. Información del estudio'),
  p('Usted está invitado a participar en el trabajo de grado **«Conecta U: Sistema web inteligente para la articulación de necesidades, capacidades y proyectos colaborativos en la UFPS»**, desarrollado por estudiantes del Programa de Ingeniería de Sistemas de la Universidad Francisco de Paula Santander bajo la dirección de la Dra. Judith del Pilar Rodríguez Tenjo.'),
  p('El estudio busca entender cómo se identifican las necesidades institucionales y cómo se eligen colaboradores para atenderlas, y evaluar una plataforma web que caracteriza necesidades y recomienda perfiles. Su participación puede consistir en una entrevista (40 a 50 minutos), en tareas de prueba con la plataforma durante el piloto y en el cuestionario de usabilidad SUS (10 preguntas).'),
  h1('2. Condiciones de la participación'),
  bullets([
    '**Voluntaria:** puede negarse a participar o retirarse en cualquier momento, sin dar explicaciones y sin ninguna consecuencia académica o laboral.',
    '**Sin riesgos previsibles** más allá del tiempo dedicado. No recibirá pago ni beneficio académico por participar.',
    '**Grabación:** la entrevista se grabará en audio solo si usted lo autoriza abajo. La grabación se usa únicamente para transcribir; se elimina al terminar el análisis.',
    '**Confidencialidad:** sus respuestas se identifican con un código (E01, P01…). En los informes no aparecerá su nombre ni datos que permitan identificarle.',
    '**Datos en la plataforma (piloto):** los datos de perfil que registre se usan solo para el piloto y para calcular las métricas del estudio; al terminar el piloto se eliminan o se anonimizan.',
    '**Tratamiento de datos personales:** conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013. Usted puede conocer, actualizar, rectificar y suprimir sus datos y revocar esta autorización escribiendo a los investigadores.',
    '**Resultados:** se usarán con fines académicos (informe del trabajo de grado y posibles publicaciones) y de forma agregada.',
  ]),
  h1('3. Contacto'),
  table(['Persona', 'Rol', 'Correo institucional'], [
    ['Jhony Gabriel Quintero Gómez', 'Investigador', ''],
    ['Walter Steven Casadiegos Quintero', 'Investigador (aplica las entrevistas)', ''],
    ['Dra. Judith del Pilar Rodríguez Tenjo', 'Directora del trabajo de grado', ''],
  ], [38, 32, 30], { minHeight: 400 }),
  spacer(),
  h1('4. Autorización'),
  p('He leído (o me han leído) la información anterior, he podido hacer preguntas y entiendo las condiciones. Marque lo que autoriza:'),
  table(['Autorizo', 'Sí', 'No'], [
    ['Participar en la entrevista estructurada', '☐', '☐'],
    ['Grabar el audio de la entrevista', '☐', '☐'],
    ['Participar en las pruebas del piloto con la plataforma', '☐', '☐'],
    ['Responder el cuestionario de usabilidad SUS', '☐', '☐'],
    ['El tratamiento de mis datos personales para los fines descritos', '☐', '☐'],
  ], [76, 12, 12]),
  spacer(200),
  table(null, [
    ['Nombre del participante', ''],
    ['Documento de identidad', ''],
    ['Rol en la UFPS', ''],
    ['Código asignado', ''],
    ['Firma', ''],
    ['Fecha', ''],
    ['Investigador que recibe (nombre y firma)', ''],
  ], [35, 65], { minHeight: 520 }),
  note('Se firman dos copias: una para el participante y otra para el archivo del trabajo de grado.', 'F2F2F2'),
];

build('F1-02 Consentimiento informado.docx', 'F1-02', children);
