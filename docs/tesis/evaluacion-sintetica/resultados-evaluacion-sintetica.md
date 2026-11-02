# Evaluación preliminar del recomendador con datos sintéticos

> **SIMULACIÓN con datos sintéticos: la pertinencia "verdadera" la fija el arquetipo con el que se generó cada persona. No reemplaza el piloto con usuarios reales ni la valoración de los expertos; sirve para verificar el funcionamiento del recomendador y compararlo con líneas base.**

## Parámetros (reproducibles)

- Semilla: `20261102` · personas generadas: 150 (120 elegibles: se excluye a quien figura NO_DISPONIBLE, igual que la plataforma por defecto) · arquetipos: 15.
- Necesidades de prueba: 20 · perfiles requeridos evaluados: 48.
- Pesos del híbrido: habilidades 0,5, semántica 0,2, experiencia 0,15, disponibilidad 0,15. Lista de 10 personas por perfil.
- Embeddings: `fake/hash-v1@768` (deterministas, sin red). Fecha de referencia: 2026-11-02.
- Pertinencia graduada: 2 si el arquetipo principal de la persona es el del perfil; 1 si es su arquetipo secundario o uno de los «también pertinentes» del perfil; 0 en otro caso.
- Reproducir: `npx ts-node scripts/synthetic/evaluate-recommender.ts --count 150 --seed 20261102`.

## Resultados (promedio sobre los perfiles; Recall, NDCG y cobertura omiten casos sin valor)

### K = 5

| Sistema | Precision@5 | Recall@5 | HitRate@5 | NDCG@5 | Cobertura de competencias@5 |
|---|---:|---:|---:|---:|---:|
| Híbrido de Conecta U (habilidades 0,5 · semántica 0,2 · experiencia 0,15 · disponibilidad 0,15) | 0,900 | 0,369 | 0,979 | 0,865 | 0,977 |
| Híbrido sin embeddings (ablación: el peso semántico se reparte) | 0,900 | 0,369 | 0,979 | 0,865 | 0,977 |
| Línea base: solo habilidades | 0,908 | 0,373 | 0,979 | 0,858 | 0,971 |
| Línea base: orden aleatorio | 0,100 | 0,037 | 0,417 | 0,061 | 0,254 |

### K = 10

| Sistema | Precision@10 | Recall@10 | HitRate@10 | NDCG@10 | Cobertura de competencias@10 |
|---|---:|---:|---:|---:|---:|
| Híbrido de Conecta U (habilidades 0,5 · semántica 0,2 · experiencia 0,15 · disponibilidad 0,15) | 0,756 | 0,614 | 1,000 | 0,811 | 0,993 |
| Híbrido sin embeddings (ablación: el peso semántico se reparte) | 0,756 | 0,614 | 1,000 | 0,811 | 0,993 |
| Línea base: solo habilidades | 0,760 | 0,616 | 1,000 | 0,805 | 0,993 |
| Línea base: orden aleatorio | 0,106 | 0,077 | 0,667 | 0,076 | 0,415 |

## Aporte de la parte semántica con estos embeddings

- El puntaje reescala el coseno entre 0,5 y 0,85 (pensado para embeddings de un modelo real como Gemini). Con `fake/hash-v1@768` el coseno perfil–persona queda en p50 = 0,147, p90 = 0,260, p99 = 0,371 y máximo 0,511: solo el 0,0 % de los pares supera el piso.
- **Por eso, en esta simulación la parte semántica casi no influye y el híbrido coincide (o casi) con la ablación sin embeddings.** No es una conclusión sobre la semántica real: para medirla hay que correr el script con embeddings de Gemini (`--embeddings gemini`, requiere `GEMINI_API_KEY`).

## Lectura

- Las líneas base acotan el resultado: «aleatorio» es el piso; «solo habilidades» muestra cuánto aporta combinar experiencia, disponibilidad y similitud de texto.
- La ablación «sin embeddings» aísla el aporte de la parte semántica (ver la sección anterior).
- El híbrido y «solo habilidades» quedan prácticamente empatados (NDCG@10: 0,811 frente a 0,805). En datos generados a partir de habilidades, estas ya explican casi toda la pertinencia; el aporte de experiencia, disponibilidad y semántica debe valorarse con el piloto y los expertos.
- Los valores dependen de cómo se generaron los datos (arquetipos, ruido, disponibilidad): sirven para verificar el artefacto y compararlo con líneas base, no como evidencia de desempeño con usuarios reales.

## Detalle por perfil (NDCG@10)

| Necesidad | Tipo | Perfil | Pertinentes | hibrido | hibrido_sin_semantica | solo_habilidades | aleatorio |
|---|---|---|---:|---:|---:|---:|---:|
| N01 | ADMINISTRATIVA | Desarrollador backend | 13 | 0,715 | 0,715 | 0,715 | 0,000 |
| N01 | ADMINISTRATIVA | Desarrollador frontend | 15 | 0,792 | 0,792 | 0,883 | 0,000 |
| N01 | ADMINISTRATIVA | Diseñador UX | 11 | 0,953 | 0,953 | 0,953 | 0,040 |
| N02 | INVESTIGATIVA | Científico de datos | 13 | 0,863 | 0,863 | 0,819 | 0,104 |
| N02 | INVESTIGATIVA | Analista de visualización | 21 | 0,614 | 0,614 | 0,563 | 0,144 |
| N02 | INVESTIGATIVA | Investigador educativo | 14 | 0,951 | 0,951 | 0,951 | 0,000 |
| N03 | INNOVACION | Ingeniero IoT | 10 | 0,947 | 0,947 | 0,947 | 0,000 |
| N03 | INNOVACION | Desarrollador móvil | 16 | 0,906 | 0,906 | 0,881 | 0,172 |
| N03 | INNOVACION | Especialista agroambiental | 12 | 0,977 | 0,977 | 0,888 | 0,251 |
| N04 | INFRAESTRUCTURA | Ingeniero DevOps | 18 | 0,881 | 0,881 | 0,954 | 0,026 |
| N04 | INFRAESTRUCTURA | Analista de seguridad | 10 | 0,909 | 0,909 | 0,909 | 0,145 |
| N05 | ACADEMICA | Desarrollador full stack | 20 | 0,183 | 0,183 | 0,177 | 0,149 |
| N05 | ACADEMICA | Scrum Master | 10 | 0,977 | 0,977 | 0,972 | 0,000 |
| N06 | BIENESTAR | Promotor de salud comunitaria | 12 | 0,663 | 0,663 | 0,663 | 0,000 |
| N06 | BIENESTAR | Productor audiovisual | 9 | 0,998 | 0,998 | 0,991 | 0,000 |
| N07 | INFRAESTRUCTURA | Ingeniero estructural | 8 | 1,000 | 1,000 | 1,000 | 0,109 |
| N07 | INFRAESTRUCTURA | Especialista ambiental | 12 | 0,923 | 0,923 | 0,917 | 0,029 |
| N08 | ADMINISTRATIVA | Asesor contable | 11 | 0,974 | 0,974 | 0,974 | 0,241 |
| N08 | ADMINISTRATIVA | Asesor jurídico | 11 | 0,617 | 0,617 | 0,617 | 0,031 |
| N09 | TECNOLOGICA | Ingeniero de aprendizaje automático | 13 | 0,890 | 0,890 | 0,882 | 0,000 |
| N09 | TECNOLOGICA | Ingeniero electrónico | 10 | 0,807 | 0,807 | 0,807 | 0,126 |
| N09 | TECNOLOGICA | Analista de procesos | 12 | 1,000 | 1,000 | 0,993 | 0,077 |
| N10 | ACADEMICA | Diseñador instruccional | 14 | 0,892 | 0,892 | 0,958 | 0,000 |
| N10 | ACADEMICA | Desarrollador web de recursos | 10 | 0,781 | 0,781 | 0,855 | 0,080 |
| N11 | INNOVACION | Gestor de emprendimiento | 18 | 0,710 | 0,710 | 0,710 | 0,123 |
| N11 | INNOVACION | Diseñador de experiencia | 11 | 0,996 | 0,996 | 0,921 | 0,025 |
| N11 | INNOVACION | Desarrollador móvil | 10 | 0,908 | 0,908 | 0,908 | 0,000 |
| N12 | ADMINISTRATIVA | Ingeniero de mejora continua | 12 | 1,000 | 1,000 | 0,906 | 0,077 |
| N12 | ADMINISTRATIVA | Auditor de calidad | 20 | 0,785 | 0,785 | 0,719 | 0,181 |
| N13 | INVESTIGATIVA | Investigador ambiental | 12 | 0,718 | 0,718 | 0,540 | 0,000 |
| N13 | INVESTIGATIVA | Analista SIG | 20 | 0,946 | 0,946 | 0,926 | 0,151 |
| N13 | INVESTIGATIVA | Desarrollador web | 18 | 0,877 | 0,877 | 0,877 | 0,057 |
| N14 | BIENESTAR | Formador docente | 14 | 0,555 | 0,555 | 0,592 | 0,000 |
| N14 | BIENESTAR | Comunicador | 9 | 0,711 | 0,711 | 0,711 | 0,000 |
| N15 | TECNOLOGICA | Desarrollador de hardware | 10 | 0,970 | 0,970 | 0,970 | 0,000 |
| N15 | TECNOLOGICA | Desarrollador backend | 13 | 0,792 | 0,792 | 0,803 | 0,023 |
| N16 | INVESTIGATIVA | Investigador cualitativo | 22 | 0,958 | 0,958 | 1,000 | 0,069 |
| N16 | INVESTIGATIVA | Trabajador social | 12 | 0,711 | 0,711 | 0,659 | 0,073 |
| N17 | INFRAESTRUCTURA | Topógrafo | 8 | 1,000 | 1,000 | 1,000 | 0,000 |
| N17 | INFRAESTRUCTURA | Diseñador urbano | 8 | 1,000 | 1,000 | 1,000 | 0,090 |
| N17 | INFRAESTRUCTURA | Gestor comunitario | 19 | 0,724 | 0,724 | 0,620 | 0,073 |
| N18 | ADMINISTRATIVA | Analista de datos | 13 | 0,313 | 0,313 | 0,317 | 0,273 |
| N18 | ADMINISTRATIVA | Gestor del proyecto | 10 | 0,775 | 0,775 | 0,796 | 0,230 |
| N19 | TECNOLOGICA | Ingeniero de IA | 20 | 0,921 | 0,921 | 0,904 | 0,093 |
| N19 | TECNOLOGICA | Desarrollador backend | 13 | 0,670 | 0,670 | 0,691 | 0,179 |
| N19 | TECNOLOGICA | Comunicador institucional | 9 | 0,733 | 0,733 | 0,733 | 0,000 |
| N20 | BIENESTAR | Especialista en SST | 21 | 0,860 | 0,860 | 0,978 | 0,089 |
| N20 | BIENESTAR | Capacitador | 22 | 0,073 | 0,073 | 0,073 | 0,107 |
