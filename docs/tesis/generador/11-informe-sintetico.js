const path = require('path');
const { build, cover, h1, h2, p, bullets, note, table, spacer } = require('./lib');

// Fase 4 DSR: informe preliminar de evaluación con datos sintéticos (SIMULACIÓN).
// Toma los números del archivo que escribe scripts/synthetic/evaluate-recommender.ts.
const result = require(path.join(__dirname, '..', 'evaluacion-sintetica', 'resultados-evaluacion-sintetica.json'));
const fmt = (v) => (v === null || v === undefined ? '—' : v.toFixed(3).replace('.', ','));
const pct = (v) => (v > 0 && v < 0.001 ? 'menos del 0,1 %' : `${(v * 100).toFixed(1).replace('.', ',')} %`);
const SYSTEMS = [
  ['hibrido', 'Híbrido de Conecta U'],
  ['hibrido_sin_semantica', 'Híbrido sin embeddings (ablación)'],
  ['solo_habilidades', 'Línea base: solo habilidades'],
  ['aleatorio', 'Línea base: aleatorio'],
];
const METRICS = [['precision', 'Precision'], ['recall', 'Recall'], ['hitRate', 'HitRate'], ['ndcg', 'NDCG'], ['coverage', 'Cobertura']];
const summaryTable = (k) =>
  table(['Sistema', ...METRICS.map(([, label]) => `${label}@${k}`)], SYSTEMS.map(([key, label]) => [label, ...METRICS.map(([m]) => fmt(result.summary[key][`@${k}`][m]))]), [34, 13, 13, 13, 13, 14]);

const { dataset, settings, semanticDiagnostics: sd, options } = result;
const hy10 = result.summary.hibrido['@10'];
const sk10 = result.summary.solo_habilidades['@10'];
const rnd10 = result.summary.aleatorio['@10'];
const hy5 = result.summary.hibrido['@5'];

const relevant = result.cases.map((c) => c.relevantCount);
const byKind = {};
for (const c of result.cases) (byKind[c.needKind] ??= []).push(c.metrics.hibrido['@10'].ndcg);
const kindRows = Object.entries(byKind).map(([kind, values]) => [kind, String(values.length), fmt(values.reduce((a, b) => a + b, 0) / values.length)]);

const children = [
  ...cover({
    code: 'F4-04',
    title: 'Informe preliminar de evaluación con datos sintéticos',
    subtitle: 'SIMULACIÓN – no reemplaza el piloto con usuarios ni la valoración de los expertos',
    phase: 'Fase 4 – Demostración y evaluación (preliminar)',
    extra: [['Reproducción', `npx ts-node scripts/synthetic/evaluate-recommender.ts --count ${options.count} --seed ${options.seed}`]],
  }),
  note('**SIMULACIÓN.** Todos los resultados de este informe provienen de personas y necesidades **generadas por computador**. La pertinencia «verdadera» la fija el arquetipo con que se generó cada persona, no un juicio humano. Sirven para verificar que el artefacto funciona y compararlo con líneas base; **no** son evidencia de su desempeño con usuarios reales y no deben presentarse como resultados del piloto.'),
  h1('1. Propósito'),
  p('Antes del piloto, verificar con un conjunto controlado y reproducible que el modelo de recomendación (F2-01) ordena mejor que líneas base sencillas, y detectar problemas de diseño que convenga corregir antes de exponerlo a usuarios.'),
  h1('2. Método'),
  h2('2.1 Datos'),
  bullets([
    `**Personas:** ${dataset.people} generadas con la semilla ${options.seed} a partir de ${dataset.archetypes} arquetipos de la comunidad UFPS (backend, frontend, móvil, datos, DevOps, IoT, UX, gestión de proyectos, investigación, civil, industrial, ambiental, comunicación, finanzas y derecho, salud). Cada persona tiene un arquetipo principal, a veces uno secundario y una habilidad de «ruido»; habilidades, niveles, meses, experiencias, intereses y disponibilidad se sortean de forma determinista. Elegibles: ${dataset.eligiblePeople} (se excluye a quien figura «No disponible», como hace la plataforma por defecto).`,
    `**Casos:** ${dataset.needs} necesidades escritas en lenguaje natural (los 7 tipos del anteproyecto) con ${dataset.profiles} perfiles requeridos; cada perfil declara el arquetipo pertinente y, a veces, otros «también pertinentes».`,
    '**Pertinencia (relevancia graduada):** 2 si el arquetipo principal de la persona es el del perfil; 1 si es su secundario o uno de los «también pertinentes»; 0 en otro caso.',
  ]),
  h2('2.2 Sistemas comparados'),
  bullets([
    `**Híbrido de Conecta U:** el código de producción (\`computeMatch\` y \`rankCandidates\`), pesos ${settings.weights.skills}/${settings.weights.semantic}/${settings.weights.experience}/${settings.weights.availability}, lista de ${settings.topN}.`,
    '**Híbrido sin embeddings:** ablación que quita la parte semántica (su peso se reparte).',
    '**Solo habilidades:** el mismo puntaje con peso 1 en habilidades y 0 en lo demás.',
    '**Aleatorio:** diez personas elegibles al azar (semilla fija).',
  ]),
  p(`Embeddings: \`${settings.embedding}\`, el proveedor determinista sin red del artefacto (bolsa de palabras con función hash). Métricas: Precision@K, Recall@K, HitRate@K, NDCG@K y cobertura de competencias@K para K = 5 y 10, promediadas sobre los perfiles (F2-01 §7).`),
  h1('3. Resultados (simulación)'),
  h2('3.1 K = 5'),
  summaryTable(5),
  spacer(),
  h2('3.2 K = 10'),
  summaryTable(10),
  spacer(),
  h2('3.3 NDCG@10 del híbrido por tipo de necesidad'),
  table(['Tipo de necesidad', 'Perfiles', 'NDCG@10 medio'], kindRows, [50, 20, 30]),
  spacer(),
  h1('4. Análisis'),
  bullets([
    `**Frente al azar:** el híbrido supera ampliamente la línea base aleatoria (NDCG@10 ${fmt(hy10.ndcg)} frente a ${fmt(rnd10.ndcg)}; Precision@5 ${fmt(hy5.precision)} frente a ${fmt(result.summary.aleatorio['@5'].precision)}). El modelo ordena primero a las personas del área que pide el perfil.`,
    `**Frente a «solo habilidades»:** quedan prácticamente empatados (NDCG@10 ${fmt(hy10.ndcg)} frente a ${fmt(sk10.ndcg)}; Precision@10 ${fmt(hy10.precision)} frente a ${fmt(sk10.precision)}). Es esperable: los datos se generaron a partir de habilidades, así que estas explican casi toda la pertinencia. La simulación no puede mostrar el aporte de la experiencia, la disponibilidad o la semántica; eso debe medirse con el piloto y la rúbrica.`,
    `**Parte semántica:** con estos embeddings el coseno perfil–persona tiene mediana ${fmt(sd.cosine.p50)}, p90 ${fmt(sd.cosine.p90)}, p99 ${fmt(sd.cosine.p99)} y máximo ${fmt(sd.cosine.max)}; solo el ${pct(sd.shareAboveFloor)} de los pares supera el piso de ${String(sd.semanticFloor).replace('.', ',')} del reescalado. Por eso el híbrido coincide con la ablación sin embeddings. **No es una conclusión sobre la semántica real**: el reescalado está pensado para embeddings de un modelo real.`,
    `**Recall@5 bajo (${fmt(hy5.recall)}):** cada perfil tiene entre ${Math.min(...relevant)} y ${Math.max(...relevant)} personas pertinentes elegibles (${(relevant.reduce((a, b) => a + b, 0) / relevant.length).toFixed(1).replace('.', ',')} en promedio), así que cinco puestos no alcanzan a recuperarlas; Recall@10 sube a ${fmt(hy10.recall)}.`,
    `**Cobertura de competencias@10:** ${fmt(hy10.coverage)}: entre las diez primeras casi siempre hay alguien con cada competencia pedida.`,
  ]),
  h1('5. Limitaciones'),
  bullets([
    'Pertinencia definida por construcción (arquetipos), no por personas: favorece a los modelos basados en habilidades.',
    'Embeddings sin modelo de lenguaje: la parte semántica queda subestimada.',
    'Perfiles y textos sintéticos más «limpios» que los reales (sin errores, sinónimos ni descripciones vagas).',
    'No se mide la tasa de aceptación ni la usabilidad: requieren usuarios.',
  ]),
  h1('6. Acciones antes del piloto'),
  bullets([
    'Correr la misma evaluación con embeddings de Gemini (`--embeddings gemini`, requiere la clave de API) para medir el aporte semántico y revisar el reescalado 0,50–0,85.',
    'Validar con los expertos los pesos del puntaje, la completitud y la prioridad (F1-05).',
    'Aplicar la rúbrica F4-01 sobre casos reales del piloto y recalcular las métricas con esa pertinencia.',
  ]),
  note('Archivos de respaldo: `docs/tesis/evaluacion-sintetica/resultados-evaluacion-sintetica.json` (todas las listas y métricas por perfil) y `.md`. Misma semilla → mismos archivos.', 'F2F2F2'),
];

build('F4-04 Informe preliminar evaluacion sintetica (SIMULACION).docx', 'F4-04 · SIMULACIÓN', children);
