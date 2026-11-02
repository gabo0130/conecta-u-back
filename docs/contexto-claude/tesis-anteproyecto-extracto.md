1.4 OBJETIVOS

1.4.1 Objetivo General

Desarrollar una plataforma web inteligente para la articulación de
necesidades institucionales con capacidades y perfiles de la comunidad
universitaria de la UFPS, mediante mecanismos de caracterización,
priorización y recomendación que apoyen la conformación de proyectos
colaborativos.

1.4.2 Objetivos Específicos

1.  Caracterizar las necesidades, los actores (administrador,
      dependencias, coordinadores, docentes, estudiantes,
      grupos/semilleros de investigación, evaluadores, líderes de
      proyecto), las capacidades, las competencias, los tipos de
      proyectos y los criterios de priorización en el contexto de la
      UFPS, mediante el diseño de una matriz estructurada de variables,
      para establecer los requerimientos funcionales y no funcionales
      que orientarán el diseño de la plataforma.

2.  Diseñar la arquitectura funcional, el modelo de información, los
      procesos de negocio, las interfaces de usuario y el modelo de
      búsqueda y recomendación basado en inteligencia artificial,
      orientado a calcular la similitud semántica entre los
      requerimientos de una oportunidad y las características de los
      perfiles registrados, con el propósito de obtener un ranking de
      colaboradores con su respectivo porcentaje de correspondencia.

3.  Implementar los módulos funcionales de la plataforma web, integrando
      el modelo de búsqueda y recomendación diseñado, para la gestión de
      oportunidades y la generación de perfiles sugeridos en un
      escenario piloto.

4.  Evaluar el funcionamiento de la plataforma y la pertinencia de las
      sugerencias generadas por el modelo, mediante pruebas de software,
      métricas de recomendación, evaluación de usabilidad y un escenario
      piloto, para el cumplimiento de los requerimientos y la utilidad
      de los perfiles recomendados.

1.5 ALCANCES Y DELIMITACIONES

1.5.1 Alcance

El proyecto comprenderá el diseño, desarrollo e implementación de un
Producto Mínimo Viable (MVP) de la plataforma web inteligente “Conecta
U”, orientado a articular necesidades institucionales con las
capacidades y perfiles de la comunidad universitaria de la Universidad
Francisco de Paula Santander (UFPS).

El MVP se delimitará al flujo principal de la propuesta:

Necesidad → Caracterización → Oportunidad → Recomendación de perfiles

Para ello, el sistema permitirá:

-   Registrar perfiles de usuario, incorporando información básica sobre
      competencias, intereses y experiencia.

-   Registrar necesidades institucionales mediante descripciones en
      lenguaje natural.

-   Caracterizar las necesidades, organizando la información relevante
      para identificar los requerimientos y competencias asociadas.

-   Generar oportunidades de proyecto a partir de las necesidades
      caracterizadas.

-   Recomendar perfiles pertinentes mediante un mecanismo de similitud
      entre los requerimientos de la oportunidad y las características
      de los perfiles registrados.

-   Visualizar los perfiles recomendados, proporcionando información que
      facilite al responsable de la oportunidad la selección de posibles
      participantes.

La validación del MVP se realizará mediante un escenario piloto
controlado, principalmente con participantes vinculados al Programa de
Ingeniería de Sistemas de la UFPS. La evaluación se centrará en:

-   Funcionamiento de las funcionalidades implementadas.

-   Pertinencia de los perfiles recomendados.

-   Usabilidad de la plataforma.

Debido a las restricciones de tiempo, recursos y al carácter individual
del desarrollo, el proyecto no incluirá en esta primera versión:

-   Conformación automática de equipos de trabajo.

-   Gestión integral y seguimiento detallado de proyectos.

-   Priorización avanzada de necesidades.

-   Integración con sistemas académicos o administrativos de la UFPS.

-   Aplicación móvil.

-   Gestión financiera, contractual o presupuestal.

-   Sistemas avanzados de comunicación entre usuarios.

-   Automatizaciones adicionales que no sean necesarias para validar el
      flujo principal del MVP.

Estos componentes se establecerán como funcionalidades de evolución
posterior, que podrán incorporarse en futuras versiones de Conecta U una
vez validado el funcionamiento y la pertinencia del MVP.

1.5.2 Limitaciones

-   Disponibilidad de participantes: La disposición de los docentes,
      estudiantes y directores de dependencias para participar en las
      entrevistas y en las pruebas del piloto dentro de los plazos
      académicos establecidos.

-   Calidad de los datos iniciales: La precisión de las recomendaciones
      dependerá directamente de la veracidad y el nivel de detalle con
      el que los usuarios registren sus perfiles, competencias e
      intereses en la plataforma.

-   Tamaño inicial del conjunto de datos: Al tratarse de un sistema
      nuevo, el motor de recomendación operará inicialmente con un
      volumen limitado de perfiles y necesidades registradas durante la
      fase de piloto.

-   Restricciones de integración y acceso: No se contempla la
      integración con sistemas académicos o administrativos externos de
      la universidad en esta primera fase, debido a la falta de APIs
      públicas o permisos de acceso directo a las bases de datos
      institucionales.

1.5.3 Delimitaciones

-   Delimitación Espacial: El proyecto se desarrollará y validará
      exclusivamente en la Universidad Francisco de Paula Santander,
      sede San José de Cúcuta.

-   Delimitación Poblacional: El escenario piloto se limitará a la
      participación de actores vinculados al Programa de Ingeniería de
      Sistemas (estudiantes, docentes, semilleros) y a un grupo
      seleccionado de dependencias administrativas o de bienestar
      institucional.

-   Delimitación Temporal: El diseño, desarrollo, implementación y
      evaluación del piloto se ejecutará en un periodo comprendido entre
      4 y 5 meses.

-   Delimitación Temática: El sistema se enfocará exclusivamente en la
      recomendación de perfiles individuales a partir de necesidades

[...]

Se adoptará un enfoque mixto, mediante la integración de técnicas
cualitativas y cuantitativas. Según Creswell y Plano Clark (2018), los
métodos mixtos permiten combinar información cualitativa y cuantitativa
para obtener una comprensión más amplia del problema investigado. En
Conecta U, el componente cualitativo permitirá comprender cómo los
actores universitarios identifican y describen sus necesidades, qué
características consideran relevantes en los perfiles y qué criterios
utilizan para valorar la pertinencia de posibles colaboradores. Para
ello, se recurrirá a la revisión documental y a entrevistas
estructuradas.

Por su parte, el componente cuantitativo permitirá evaluar el
funcionamiento de la plataforma y el comportamiento del mecanismo de
recomendación mediante indicadores medibles. Se considerarán métricas
como Precision@K, Recall@K, Hit Rate@K y NDCG@K para evaluar la
pertinencia y el orden de los perfiles recomendados, así como la
puntuación del cuestionario System Usability Scale (SUS) para valorar la
usabilidad de la plataforma. La combinación de ambos componentes
permitirá utilizar los hallazgos de la caracterización como insumo para
el diseño de la solución y, posteriormente, evaluar sus resultados en un
escenario piloto.

3.2 Método de Investigación: Design Science Research (DSR)

El método de investigación seleccionado es Design Science Research
(DSR), conocido como investigación en ciencias del diseño. Hevner et al.
(2004) plantean que este enfoque se orienta a la creación y evaluación
de artefactos diseñados para resolver problemas relevantes en un
contexto determinado. Asimismo, Peffers et al. (2007) proponen una
metodología que organiza la investigación en actividades relacionadas
con la identificación del problema, la definición de los objetivos de la
solución, el diseño y desarrollo del artefacto, su demostración, su
evaluación y la comunicación de los resultados.

Este método resulta pertinente para Conecta U porque el resultado
principal de la investigación será un artefacto tecnológico: una
plataforma web inteligente que permita gestionar necesidades
universitarias y recomendar perfiles según los requerimientos
identificados. Su desarrollo requiere comprender el problema en el
contexto de la UFPS, establecer los requerimientos de la solución,
diseñar su arquitectura y modelo de información, implementar los módulos
funcionales y evaluar su funcionamiento.

En correspondencia con los planteamientos de Hevner et al. (2004) y la
metodología propuesta por Peffers et al. (2007), el proceso de
investigación se organizará en las siguientes seis fases, adaptadas al
alcance y los objetivos del proyecto:
[]

3.3 Población y Muestra

La población y la muestra se definirán de acuerdo con las diferentes
fases del proyecto, debido a que cada etapa requiere la participación de
actores con características y propósitos de análisis diferentes. En
consecuencia, no se utilizará una única estrategia muestral para todo el
estudio.

3.3.1 Población

La población de referencia estará constituida por los actores de la
Universidad Francisco de Paula Santander relacionados con la
identificación de necesidades, formulación de iniciativas y
participación en proyectos académicos o de investigación. Esta población
comprende:

-   Estudiantes del Programa de Ingeniería de Sistemas.

-   Docentes del Programa de Ingeniería de Sistemas.

-   Líderes de semilleros y grupos de investigación.

-   Coordinadores o responsables académicos relacionados con el
      programa.

-   Representantes de dependencias universitarias que puedan formular
      necesidades institucionales.

La unidad de análisis estará constituida por cada participante que
aporte información sobre necesidades, competencias, criterios de
selección de perfiles o experiencia de uso de la plataforma.

3.3.2 Muestra para la caracterización

Para la fase de caracterización se empleará un muestreo no
probabilístico intencional, seleccionando participantes que, por su
experiencia y relación con actividades académicas, investigativas o
institucionales, puedan aportar información relevante para definir los
requisitos y variables del sistema.

La muestra estará conformada principalmente por:

-   Docentes con experiencia en proyectos académicos o de investigación.

-   Líderes de semilleros o grupos de investigación.

-   Estudiantes con experiencia en proyectos académicos o colaborativos.

-   Representantes de dependencias que participen en la formulación de
      necesidades, cuando sea posible su vinculación.

En esta fase no se establecerá un porcentaje fijo de la población,
debido a que el propósito de las entrevistas será obtener información
pertinente para la caracterización del problema y la identificación de
requisitos, y no realizar una estimación estadística de parámetros
poblacionales.

3.3.3 Muestra para la evaluación del MVP

Para la evaluación del Producto Mínimo Viable se utilizará una muestra
no probabilística de tipo intencional, seleccionada entre usuarios
potenciales del sistema pertenecientes principalmente al Programa de
Ingeniería de Sistemas de la UFPS.

La selección buscará incluir participantes que representen los
principales perfiles de uso del MVP:

-   Estudiantes, como usuarios que registran sus competencias y reciben
      recomendaciones.

-   Docentes o formuladores, como usuarios que registran necesidades y
      consultan perfiles recomendados.

-   Usuarios con experiencia en proyectos académicos o de investigación,
      para valorar la pertinencia de las recomendaciones.

El tamaño definitivo de esta muestra se establecerá de acuerdo con la
disponibilidad de participantes y las condiciones del escenario piloto.
La cantidad de participantes será reportada explícitamente en los
resultados de la investigación, junto con sus características y
criterios de selección.

3.3.4 Criterios de inclusión

Podrán participar en las diferentes fases del estudio las personas que
cumplan con los siguientes criterios:

-   Pertenecer a la comunidad universitaria de la UFPS o estar
      directamente vinculadas con las actividades contempladas en el
      escenario piloto.

-   Tener relación con actividades académicas, investigativas o de
      formulación de necesidades.

-   Aceptar voluntariamente participar en el estudio.

-   Contar con disponibilidad para responder los instrumentos o
      participar en las pruebas correspondientes.

3.3.5 Criterios de exclusión

Se excluirán del estudio:

-   Personas que no tengan relación con el escenario definido para el
      piloto.

-   Participantes que no completen los instrumentos requeridos para la
      fase correspondiente.

-   Registros o respuestas que presenten información insuficiente para
      su análisis.

-   Participantes que manifiesten su decisión de retirarse del estudio.

3.3.6 Correspondencia entre fases y estrategias muestrales

La estrategia de selección de participantes se resume de la siguiente
manera:

  Fase                              Propósito                                                                Participantes                                                                      Tipo de muestreo
  --------------------------------- ------------------------------------------------------------------------ ---------------------------------------------------------------------------------- -----------------------------------
  Caracterización                   Identificar necesidades, variables, criterios y requisitos               Docentes, líderes de investigación, estudiantes y representantes de dependencias   No probabilístico intencional
  Validación de requisitos/diseño   Verificar la pertinencia de las variables y funcionalidades propuestas   Docentes o expertos relacionados con el área                                       Muestreo intencional por expertos
  Evaluación del MVP                Evaluar funcionalidad, recomendaciones y usabilidad                      Estudiantes y docentes usuarios potenciales                                        No probabilístico intencional

Esta diferenciación permitirá que la selección de participantes sea
coherente con los objetivos de cada fase y evitará establecer un
porcentaje arbitrario de la población como criterio único para
determinar el tamaño de la muestra.

3.4 Técnicas e Instrumentos de Recolección de Información

Para la recolección de la información necesaria para el desarrollo de
Conecta U se emplearán las técnicas de revisión documental, entrevistas
estructuradas y evaluación mediante instrumentos estandarizados y
rúbricas. Estas técnicas permitirán obtener información relacionada con
las competencias de los estudiantes, la caracterización de las
necesidades universitarias, la pertinencia de las recomendaciones
generadas por el sistema y la usabilidad de la plataforma.

La revisión documental permitirá analizar formatos de proyectos de aula,
convocatorias internas, planes de desarrollo y demás documentos
institucionales relacionados con la formulación y desarrollo de
proyectos universitarios. La información obtenida será organizada
mediante una matriz de revisión documental, con el propósito de
identificar los elementos y características que deben considerarse en la
caracterización de las necesidades y en la definición de los
requerimientos de la plataforma.

Las entrevistas estructuradas estarán dirigidas a docentes,
coordinadores, directores de grupos de investigación y otros actores con
experiencia o participación en la formulación y desarrollo de proyectos
universitarios. Estas entrevistas permitirán identificar las
características necesarias para describir una necesidad, los criterios
utilizados para determinar las capacidades requeridas, las
características que deben considerarse en los perfiles de los
participantes y los criterios empleados para establecer la pertinencia
de posibles integrantes para una iniciativa.

Las preguntas de las entrevistas serán organizadas de acuerdo con las
categorías de análisis definidas en la investigación. Las respuestas
obtenidas serán analizadas mediante codificación temática, identificando
conceptos, características y criterios recurrentes entre los
participantes. Posteriormente, la información será agrupada y
relacionada con las variables e indicadores definidos en la
investigación.

La transformación de los resultados cualitativos en elementos
utilizables para el diseño de la plataforma seguirá una relación de
trazabilidad definida como:

Categoría de análisis → Variable → Indicador → Pregunta → Fuente →
Requisito derivado.

Este procedimiento permitirá determinar cuáles de los elementos
identificados durante las entrevistas y la revisión documental deben ser
incorporados al modelo de información, a los requerimientos funcionales
o a los criterios utilizados por el mecanismo de recomendación.

Validación de los instrumentos

Los instrumentos diseñados para la recolección de información serán
sometidos a validación de contenido mediante juicio de expertos, con el
propósito de determinar si las preguntas, variables e indicadores son
claros, pertinentes, coherentes y suficientes para alcanzar los
objetivos planteados en la investigación.

Se propone realizar la validación con tres expertos, seleccionados de
acuerdo con los siguientes criterios:

-   Formación profesional o académica relacionada con ingeniería de
      sistemas, investigación, educación superior, gestión de proyectos
      o áreas afines.

-   Experiencia en formulación, gestión, evaluación o desarrollo de
      proyectos universitarios.

-   Experiencia suficiente para valorar la pertinencia de las variables,
      indicadores e instrumentos definidos.

-   Disponibilidad para revisar los instrumentos y emitir observaciones
      sobre su contenido.

Cada experto evaluará los elementos de los instrumentos considerando los
criterios de claridad, pertinencia, coherencia y suficiencia. Las
valoraciones y observaciones serán consolidadas por los investigadores
para identificar los elementos que requieran modificación.

Cuando se identifiquen preguntas o elementos que presenten problemas de
comprensión, falta de pertinencia o inconsistencias con las categorías
de análisis, estos serán ajustados antes de la aplicación definitiva de
los instrumentos. El proceso de validación permitirá fortalecer la
correspondencia entre los instrumentos, las variables y los objetivos de
la investigación.

La rúbrica utilizada para evaluar la pertinencia de las recomendaciones
generadas por el sistema también será sometida al proceso de validación
por juicio de expertos. Esta permitirá verificar que los criterios
empleados para determinar la pertinencia de los perfiles sugeridos sean
adecuados para valorar la capacidad del mecanismo de recomendación.

Análisis de las entrevistas y definición de variables

Las entrevistas serán transcritas y organizadas para facilitar su
análisis. Inicialmente se identificarán las unidades de información
relacionadas con las categorías definidas en la investigación.
Posteriormente, estas serán agrupadas de acuerdo con los temas y
criterios identificados en las respuestas.

Los resultados serán contrastados con la información obtenida mediante
la revisión documental con el propósito de identificar coincidencias y
diferencias. Los elementos que presenten relevancia para el problema de
investigación serán posteriormente relacionados con las variables e
indicadores definidos.

De esta manera, la información cualitativa permitirá complementar y
precisar las variables que serán utilizadas para el desarrollo y
evaluación de la plataforma. Por ejemplo, las características
identificadas en las entrevistas respecto a las competencias requeridas
podrán traducirse en atributos del perfil y criterios utilizados para
determinar la coincidencia semántica entre las competencias del
estudiante y los requerimientos de una necesidad.

La información obtenida también permitirá establecer los atributos
necesarios para la caracterización de las necesidades, así como los
criterios que deberán ser considerados por el mecanismo de
recomendación.

Evaluación de las variables

Para evaluar el funcionamiento de la solución propuesta se considerarán
las variables definidas en la matriz de investigación.

La variable competencias del estudiante será evaluada mediante el
porcentaje de coincidencia semántica entre las competencias del
estudiante y los requisitos de una necesidad. Esta medición permitirá
determinar el grado de correspondencia entre las capacidades registradas
en el perfil del estudiante y aquellas requeridas para atender una
necesidad o proyecto.

La variable caracterización de necesidades será evaluada mediante un
índice de completitud de la necesidad registrada mediante lenguaje
natural. Este indicador permitirá determinar qué tan completa se
encuentra la información obtenida a partir de la descripción inicial de
una necesidad y establecer si contiene los elementos necesarios para
continuar con el proceso de articulación.

La variable precisión de la recomendación será evaluada mediante
métricas propias de sistemas de recomendación, complementadas con la
valoración de expertos y la aceptación de los perfiles sugeridos. Se
considerarán las métricas Precision@K, Recall@K, Hit Rate@K y NDCG@K,
las cuales permitirán analizar el comportamiento del mecanismo al
generar los primeros K perfiles recomendados para una necesidad
determinada.

Precision@K permitirá determinar la proporción de perfiles pertinentes
dentro de los primeros K perfiles recomendados. Recall@K permitirá
determinar la proporción de los perfiles considerados pertinentes que
fueron recuperados por el sistema dentro de las primeras K
recomendaciones. Hit Rate@K permitirá establecer si dentro de las
primeras K recomendaciones se encuentra al menos un perfil considerado
pertinente. Por su parte, NDCG@K permitirá evaluar la calidad del
ordenamiento de las recomendaciones, considerando la posición en la que
aparecen los perfiles pertinentes.

Estas métricas serán calculadas a partir de un conjunto de casos de
prueba en los que se establecerá cuáles perfiles son considerados
relevantes para cada necesidad. La pertinencia de los perfiles será
determinada mediante una rúbrica de evaluación aplicada por formuladores
de proyectos y docentes expertos, quienes valorarán la correspondencia
entre las características de los perfiles y los requerimientos de las
necesidades evaluadas.

Adicionalmente, se calculará la tasa de aceptación de los perfiles
sugeridos como indicador complementario de la percepción de utilidad de
las recomendaciones por parte de los usuarios responsables de las
necesidades. Esta tasa permitirá identificar la proporción de perfiles
recomendados que son aceptados frente al total de perfiles evaluados.
Por tanto, la tasa de aceptación se interpretará como una medida de
aceptación de la recomendación, mientras que las métricas Precision@K,
Recall@K, Hit Rate@K y NDCG@K permitirán evaluar el desempeño del
mecanismo de recomendación.

Finalmente, se considerará la cobertura de competencias para determinar
en qué medida los perfiles recomendados permiten cubrir las competencias
identificadas como necesarias para atender una determinada necesidad. La
combinación de estas métricas permitirá realizar una evaluación
cuantitativa y cualitativa del mecanismo de recomendación.

La variable usabilidad de la plataforma será evaluada mediante la
puntuación obtenida en el System Usability Scale (SUS). El cuestionario
será aplicado posteriormente al desarrollo del escenario piloto a
estudiantes, docentes y administradores que participen en este. La
puntuación obtenida permitirá valorar cuantitativamente la facilidad de
uso y percepción de los usuarios frente a la plataforma.

Matriz de trazabilidad

Con el propósito de mantener la correspondencia entre la información
recolectada, las variables, los indicadores y los requerimientos de la
solución, se utilizará una matriz de trazabilidad como instrumento de
apoyo al proceso de investigación.

  Categoría       Variable                         Indicador                                                                                                             Pregunta / elemento de análisis                                                                    Fuente                                                             Requisito derivado
  --------------- -------------------------------- --------------------------------------------------------------------------------------------------------------------- -------------------------------------------------------------------------------------------------- ------------------------------------------------------------------ ------------------------------------------------------------------------------------------------------------------------
  Competencias    Competencias del estudiante      Porcentaje de coincidencia semántica entre competencias y requisitos                                                  ¿Qué competencias y conocimientos son necesarios para atender la necesidad?                        Estudiantes y docentes participantes del piloto                    El sistema debe representar las competencias de los estudiantes y compararlas con los requisitos de una necesidad.
  Necesidades     Caracterización de necesidades   Índice de completitud de la necesidad registrada mediante lenguaje natural                                            ¿Qué información debe contener una necesidad para ser considerada suficientemente caracterizada?   Dependencias y docentes formuladores                               El sistema debe permitir registrar una necesidad mediante lenguaje natural y obtener una caracterización estructurada.
  Recomendación   Precisión de la recomendación    Precision@K, Recall@K, Hit Rate@K, NDCG@K, tasa de aceptación, pertinencia por expertos y cobertura de competencias   Casos de prueba, métricas del sistema, rúbrica de pertinencia y registro de aceptación             Formuladores de proyectos y docentes expertos                      El sistema debe generar recomendaciones de perfiles de acuerdo con los requerimientos identificados.
  Usabilidad      Usabilidad de la plataforma      Puntuación obtenida en el System Usability Scale (SUS)                                                                ¿Qué tan fácil de utilizar, comprender y aprender resulta la plataforma?                           Estudiantes, docentes y administradores participantes del piloto   La plataforma debe proporcionar una interfaz comprensible y fácil de utilizar.

4. CRONOGRAMA

[]

5. PRESUPUESTO

Costo de recurso humano

  Insumo / Servicio             Especificaciones Técnicas / Funciones                                          Cantidad   Tiempo    Costo Mensual (COP)   Subtotal (COP)
  ----------------------------- ------------------------------------------------------------------------------ ---------- --------- --------------------- ----------------
  Estudiantes Desarrolladores   Análisis, diseño, desarrollo, pruebas, documentación y gestión del proyecto.   2          5 meses   $2.812.680            $28.126.800
  Subtotal Recurso Humano                                                                                                                                 $28.126.800

Insumos tecnológicos

  Insumo / Servicio                      Especificaciones Técnicas / Funciones                                                                   Cantidad   Tiempo    Costo Mensual (COP)   Subtotal (COP)
  -------------------------------------- ------------------------------------------------------------------------------------------------------- ---------- --------- --------------------- ----------------

[...]
ANEXOS

ANEXO A: BORRADOR PRELIMINAR DE LA ENTREVISTA ESTRUCTURADA DIRIGIDA A
DOCENTES Y EXPERTOS

Objetivo: Obtener información válida de docentes y expertos de la UFPS
para estructurar las variables de competencias, perfiles y criterios de
priorización que alimentarán el motor de recomendación de la plataforma
"Conecta U".

Estructura del Instrumento por Dimensiones:

Dimensión A: Identificación del Actor

1.  ¿Cuál es su rol principal dentro de la institución (Docente de
      planta, Investigador, Director de plan de estudios, Líder de
      semillero)?

2.  ¿A qué departamento académico o grupo de investigación se encuentra
      adscrito?

Dimensión B: Gestión Actual de Necesidades

3.  ¿Cuáles son los principales canales o medios por los cuales usted
      identifica o recibe actualmente las necesidades académicas,
      administrativas o de investigación en la universidad?

4.  ¿Qué dificultades experimenta al intentar comunicar o dar solución a
      estas necesidades con los recursos actuales?

Dimensión C: Caracterización de Necesidades

5.  Cuando se presenta una problemática en su área, ¿qué información
      considera indispensable registrar para que otra persona entienda
      el problema y proponga una solución?

Dimensión D: Competencias y Capacidades

6.  ¿Cómo define y clasifica las competencias técnicas y habilidades
      blandas de los estudiantes que participan en sus iniciativas o
      proyectos?

Dimensión E: Criterios de Recomendación de Perfiles

7.  ¿Bajo qué criterios (afinidad temática, nivel de competencias,
      disponibilidad de tiempo) considera que la plataforma debería
      recomendar perfiles individuales para las necesidades registradas?

Dimensión F: Selección de Colaboradores

8.  Al momento de buscar un colaborador para un proyecto de aula o de
      investigación, ¿qué criterios académicos (promedio, asignaturas
      aprobadas) y no académicos (intereses, experiencia previa)
      considera más críticos?

Dimensión G: Recomendaciones Esperadas

9.  ¿Qué tipo de sugerencias o alertas esperaría recibir del motor
      inteligente al momento de registrar una nueva necesidad en
      lenguaje natural?

Dimensión H: Restricciones

10. ¿Qué limitaciones o reglas de negocio (por ejemplo, número máximo de
      integrantes por equipo, cruce de horarios) debería validar el
      sistema de forma obligatoria?

Dimensión I: Trazabilidad

11. ¿Qué estados o fases considera que debe atravesar una necesidad
      desde que se registra hasta que se convierte en un proyecto
      finalizado?

Dimensión J: Validación de Resultados

12. ¿Qué criterios o métricas definiría usted para evaluar si la
      recomendación de un perfil individual fue exitosa y pertinente
      para el proyecto?
