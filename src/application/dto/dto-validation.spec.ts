import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CollaboratorSkillDto } from './collaborator-skill.dto';
import { ExperienceDto } from './experience.dto';
import { RegisterDto } from './register.dto';
import { SearchSkillsQueryDto } from './search-skills-query.dto';
import { UpdateProjectDto } from './update-project.dto';

const errorsOf = <T extends object>(
  type: new () => T,
  plain: Record<string, unknown>,
) =>
  validateSync(plainToInstance(type, plain)).flatMap((error) => [
    error.property,
    ...Object.values(error.constraints ?? {}),
  ]);

describe('DTO validation', () => {
  const register = {
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    password: 'Secret123*',
  };

  it('requires collaborator data when registering a COLABORADOR', () => {
    expect(
      errorsOf(RegisterDto, { ...register, role: 'COLABORADOR' }),
    ).toContain('Los datos del colaborador son obligatorios');
  });

  it('does not require collaborator data for a LIDER', () => {
    expect(errorsOf(RegisterDto, { ...register, role: 'LIDER' })).toEqual([]);
  });

  it('keeps at least one deliverable when updating a project', () => {
    expect(errorsOf(UpdateProjectDto, { deliverables: [] })).toContain(
      'deliverables',
    );
    expect(errorsOf(UpdateProjectDto, {})).toEqual([]);
  });

  it('rejects a last used year in the future', () => {
    const skill = {
      skillId: '3f1c2a8e-1b2c-4d5e-8f90-123456789abc',
      level: 'BASICO',
      experienceMonths: 1,
    };

    expect(
      errorsOf(CollaboratorSkillDto, { ...skill, lastUsedYear: 3000 }),
    ).toContain('El año de último uso debe estar entre 1970 y el año en curso');
    expect(
      errorsOf(CollaboratorSkillDto, { ...skill, lastUsedYear: 2024 }),
    ).toEqual([]);
  });

  it('rejects experience dates that do not exist in the calendar', () => {
    const experience = {
      type: 'LABORAL',
      role: 'Dev',
      organization: 'UFPS',
      current: false,
      weeklyHours: 10,
      level: 'BASICO',
    };

    expect(
      errorsOf(ExperienceDto, { ...experience, startDate: '2024-02-30' }),
    ).toContain('startDate debe ser una fecha válida con formato AAAA-MM-DD');
    expect(
      errorsOf(ExperienceDto, { ...experience, startDate: '2024-02-29' }),
    ).toEqual([]);
  });

  it('only accepts known skill types in the search query', () => {
    expect(errorsOf(SearchSkillsQueryDto, { type: 'FOO' })).toContain('type');
    expect(errorsOf(SearchSkillsQueryDto, { q: 'react' })).toEqual([]);
  });
});
