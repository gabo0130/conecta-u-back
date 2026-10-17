import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { Level } from '../../domain/entities/level.type';
import { redactContactData } from './contact-data';

const LEVEL_LABEL: Record<Level, string> = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
  EXPERTO: 'Experto',
};

const EXPERIENCE_DESCRIPTION_MAX_LENGTH = 200;
const TEXT_MAX_LENGTH = 4000;

/**
 * Texto de una persona que se convierte en embedding: resumen, habilidades y experiencias.
 * Nunca incluye correo, teléfono ni otros datos de contacto. Devuelve `''` si el perfil no
 * tiene contenido que representar.
 */
export function collaboratorEmbeddingText(
  collaborator: CollaboratorEntity,
): string {
  const parts: string[] = [];

  const summary = redactContactData(collaborator.summary ?? '');
  if (summary) parts.push(summary);

  if (collaborator.skills.length > 0) {
    const skills = collaborator.skills.map(
      (entry) =>
        `${entry.skill.name}, nivel ${LEVEL_LABEL[entry.level]}, ${entry.experienceMonths} meses`,
    );
    parts.push(`Habilidades: ${skills.join('; ')}.`);
  }

  if (collaborator.experiences.length > 0) {
    const experiences = collaborator.experiences.map((experience) => {
      const technologies = experience.technologies
        .map((technology) => technology.name)
        .join(', ');
      const description = redactContactData(experience.description ?? '').slice(
        0,
        EXPERIENCE_DESCRIPTION_MAX_LENGTH,
      );
      return [
        redactContactData(`${experience.role} en ${experience.organization}`),
        technologies ? `tecnologías: ${technologies}` : '',
        description,
      ]
        .filter(Boolean)
        .join(' — ');
    });
    parts.push(`Experiencia: ${experiences.join('; ')}.`);
  }

  return parts.join(' ').slice(0, TEXT_MAX_LENGTH);
}
