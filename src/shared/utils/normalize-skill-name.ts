/**
 * Forma canónica para comparar habilidades: minúsculas, sin tildes, espacios colapsados.
 * Conserva `#` y `+` para distinguir "C", "C#" y "C++".
 */
export function normalizeSkillName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9#+\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
