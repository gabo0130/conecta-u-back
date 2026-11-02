import { ARCHETYPES, ARCHETYPE_BY_KEY, type Archetype } from './archetypes';

// Generador determinista de personas sintéticas (misma semilla → mismo conjunto). Sirve para
// (a) poblar una base de demostración y (b) la evaluación preliminar del recomendador de la
// tesis, donde la pertinencia "verdadera" se conoce porque cada persona nace de un arquetipo.
// No son personas reales: los correos usan el dominio reservado `sintetico.conectau.test`.

export type Level = 'BASICO' | 'INTERMEDIO' | 'AVANZADO' | 'EXPERTO';
const LEVELS: Level[] = ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO'];

export interface SyntheticSkill {
  name: string;
  level: Level;
  months: number;
  lastUsedYear: number;
}

export interface SyntheticExperience {
  type: 'LABORAL' | 'PRACTICA' | 'PROYECTO_ACADEMICO' | 'SEMILLERO_INVESTIGACION' | 'DOCENCIA';
  role: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  weeklyHours: number;
  level: Level;
  technologies: string[];
}

export interface SyntheticPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personType: 'ESTUDIANTE' | 'DOCENTE';
  program: string;
  semester: number | null;
  primary: string;
  secondary: string | null;
  summary: string;
  interests: string[];
  availabilityStatus: 'DISPONIBLE' | 'PARCIAL' | 'NO_DISPONIBLE';
  weeklyHours: number;
  skills: SyntheticSkill[];
  experiences: SyntheticExperience[];
}

/** PRNG mulberry32: reproducible en cualquier máquina. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]) => items[Math.floor(next() * items.length)];
  const sample = <T>(items: readonly T[], count: number, bias = 0) => {
    // `bias` > 0 favorece los primeros elementos (los más característicos del arquetipo).
    const pool = items.map((item, index) => ({ item, key: next() * (1 + bias * (index / items.length)) }));
    return pool.sort((a, b) => a.key - b.key).slice(0, Math.min(count, items.length)).map((entry) => entry.item);
  };
  return { next, int, pick, sample };
}

const FIRST_NAMES = ['Ana', 'Luis', 'María', 'Carlos', 'Valentina', 'Andrés', 'Camila', 'Julián', 'Laura', 'Diego', 'Sofía', 'Mateo', 'Daniela', 'Santiago', 'Paula', 'Sebastián', 'Natalia', 'Felipe', 'Juliana', 'David', 'Mariana', 'Jorge', 'Isabella', 'Kevin', 'Gabriela', 'Óscar', 'Lina', 'Brayan', 'Karen', 'Esteban'];
const LAST_NAMES = ['Rojas', 'Pérez', 'Gómez', 'Contreras', 'Quintero', 'Ortiz', 'Ramírez', 'Suárez', 'Jaimes', 'Villamizar', 'Peñaranda', 'Durán', 'Carrillo', 'Mendoza', 'Rincón', 'Parada', 'Lizcano', 'Galvis', 'Vera', 'Sanabria', 'Ibarra', 'Bautista', 'Torres', 'Leal'];

const LEVEL_WEIGHTS: Record<'ESTUDIANTE' | 'DOCENTE', number[]> = {
  ESTUDIANTE: [0.3, 0.45, 0.2, 0.05],
  DOCENTE: [0.05, 0.25, 0.45, 0.25],
};

function weightedLevel(random: ReturnType<typeof createRandom>, type: 'ESTUDIANTE' | 'DOCENTE', boost = 0): Level {
  const weights = LEVEL_WEIGHTS[type];
  let roll = random.next();
  for (let index = 0; index < weights.length; index++) {
    roll -= weights[index];
    if (roll <= 0) return LEVELS[Math.min(LEVELS.length - 1, index + boost)];
  }
  return LEVELS[LEVELS.length - 1];
}

function isoDate(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function skillsFrom(
  random: ReturnType<typeof createRandom>,
  archetype: Archetype,
  type: 'ESTUDIANTE' | 'DOCENTE',
  counts: { knowledge: number; competencies: number; soft: number },
  boost: number,
): SyntheticSkill[] {
  const make = (name: string): SyntheticSkill => ({
    name,
    level: weightedLevel(random, type, boost),
    months: random.int(type === 'DOCENTE' ? 12 : 3, type === 'DOCENTE' ? 96 : 36),
    lastUsedYear: random.int(2023, 2026),
  });
  return [
    ...random.sample(archetype.knowledge, counts.knowledge, 2).map(make),
    ...random.sample(archetype.competencies, counts.competencies, 1).map(make),
    ...random.sample(archetype.soft, counts.soft).map(make),
  ];
}

export function generatePeople(count: number, seed = 20261102): SyntheticPerson[] {
  const random = createRandom(seed);
  const people: SyntheticPerson[] = [];
  for (let index = 0; index < count; index++) {
    // Reparto equilibrado: cada arquetipo recibe ~count/15 personas.
    const primary = ARCHETYPES[index % ARCHETYPES.length];
    const secondary = random.next() < 0.35 ? random.pick(ARCHETYPES.filter((item) => item.key !== primary.key)) : null;
    const personType: 'ESTUDIANTE' | 'DOCENTE' = random.next() < 0.25 ? 'DOCENTE' : 'ESTUDIANTE';
    const firstName = random.pick(FIRST_NAMES);
    const lastName = `${random.pick(LAST_NAMES)} ${random.pick(LAST_NAMES)}`;
    const id = `S${String(index + 1).padStart(3, '0')}`;

    const skills = new Map<string, SyntheticSkill>();
    for (const skill of skillsFrom(random, primary, personType, { knowledge: random.int(3, 6), competencies: random.int(1, 2), soft: random.int(2, 3) }, 0)) {
      skills.set(skill.name, skill);
    }
    if (secondary) {
      for (const skill of skillsFrom(random, secondary, personType, { knowledge: random.int(1, 2), competencies: random.int(0, 1), soft: 1 }, 0)) {
        if (!skills.has(skill.name)) skills.set(skill.name, { ...skill, level: skill.level === 'EXPERTO' ? 'AVANZADO' : skill.level });
      }
    }
    // Ruido: una habilidad de cualquier otro arquetipo (perfiles reales no son puros).
    if (random.next() < 0.5) {
      const noise = random.pick(random.pick(ARCHETYPES).knowledge);
      if (!skills.has(noise)) skills.set(noise, { name: noise, level: 'BASICO', months: random.int(1, 6), lastUsedYear: 2024 });
    }

    const roll = random.next();
    const availabilityStatus = roll < 0.55 ? 'DISPONIBLE' : roll < 0.85 ? 'PARCIAL' : 'NO_DISPONIBLE';
    const weeklyHours = availabilityStatus === 'NO_DISPONIBLE' ? 0 : availabilityStatus === 'PARCIAL' ? random.int(3, 8) : random.int(6, 20);

    const experiences: SyntheticExperience[] = [];
    for (let e = 0; e < random.int(0, 2) + (personType === 'DOCENTE' ? 1 : 0); e++) {
      const startYear = random.int(2019, 2025);
      const current = random.next() < 0.3;
      const type: SyntheticExperience['type'] =
        personType === 'DOCENTE' && e === 0 ? 'DOCENCIA' : random.pick(['LABORAL', 'PRACTICA', 'PROYECTO_ACADEMICO', 'SEMILLERO_INVESTIGACION'] as const);
      experiences.push({
        type,
        role: random.pick(primary.roles),
        organization: random.pick(primary.organizations),
        startDate: isoDate(startYear, random.int(1, 12)),
        endDate: current ? null : isoDate(Math.min(2026, startYear + random.int(0, 2)), random.int(1, 12)),
        weeklyHours: random.int(6, 40),
        level: weightedLevel(random, personType),
        technologies: random.sample(primary.knowledge, random.int(1, 3), 2),
      });
    }
    // Una fecha de fin anterior al inicio no es válida: se corrige.
    for (const experience of experiences) {
      if (experience.endDate && experience.endDate < experience.startDate) experience.endDate = experience.startDate;
    }

    const phrases = random.sample(primary.phrases, 2);
    const summary = `${personType === 'DOCENTE' ? 'Docente' : 'Estudiante'} de ${primary.label.toLowerCase()}: ${phrases.join(' y ')}.${secondary ? ` También ${random.pick(secondary.phrases)}.` : ''}`;

    people.push({
      id,
      firstName,
      lastName,
      email: `${id.toLowerCase()}.${firstName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}@sintetico.conectau.test`,
      personType,
      program: random.pick(primary.programs),
      semester: personType === 'ESTUDIANTE' ? random.int(3, 10) : null,
      primary: primary.key,
      secondary: secondary?.key ?? null,
      summary,
      interests: [primary.label, ...(secondary ? [secondary.label] : [])],
      availabilityStatus,
      weeklyHours,
      skills: [...skills.values()],
      experiences,
    });
  }
  return people;
}

/** Relevancia graduada de una persona para un arquetipo pedido: 2 primaria, 1 secundaria. */
export function relevanceOf(person: Pick<SyntheticPerson, 'primary' | 'secondary'>, archetype: string, alsoRelevant: string[] = []): number {
  if (person.primary === archetype) return 2;
  if (person.secondary === archetype || alsoRelevant.includes(person.primary)) return 1;
  return 0;
}

export { ARCHETYPE_BY_KEY };
