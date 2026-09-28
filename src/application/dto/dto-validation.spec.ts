import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CollaboratorSkillDto } from './collaborator-skill.dto';
import { CreateProjectDto } from './create-project.dto';
import { ExperienceDto } from './experience.dto';
import { RegisterDto } from './register.dto';
import { SearchSkillsQueryDto } from './search-skills-query.dto';
import { UpdateCollaboratorDto } from './update-collaborator.dto';
import { UpdateProjectDto } from './update-project.dto';
import { UpdateUserDto } from './update-user.dto';

const errorsOf = (type: new () => object, plain: Record<string, unknown>) =>
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

  it.each([
    [UpdateCollaboratorDto, 'firstName'],
    [UpdateCollaboratorDto, 'programId'],
    [UpdateProjectDto, 'deliverables'],
    [UpdateProjectDto, 'title'],
    [UpdateProjectDto, 'typeData'],
    [UpdateUserDto, 'fullName'],
    [UpdateUserDto, 'active'],
    [ExperienceDto, 'skillIds'],
  ] as const)(
    'rejects null in %p.%s instead of letting it reach the database',
    (type, field) => {
      expect(errorsOf(type, { [field]: null })).toContain(
        `${field} no puede ser nulo`,
      );
    },
  );

  it('accepts null where it means clearing a nullable field', () => {
    expect(
      errorsOf(UpdateCollaboratorDto, {
        semester: null,
        researchGroup: null,
        summary: null,
        profileUrl: null,
      }),
    ).toEqual([]);
    expect(errorsOf(UpdateProjectDto, { programId: null })).toEqual([]);
  });

  it('only accepts http(s) profile links, in creation and update', () => {
    const message =
      'El enlace debe empezar por http:// o https:// y tener máximo 300 caracteres';
    expect(
      errorsOf(UpdateCollaboratorDto, { profileUrl: 'javascript:alert(1)' }),
    ).toContain(message);
    expect(
      errorsOf(UpdateCollaboratorDto, {
        profileUrl: `https://github.com/${'a'.repeat(300)}`,
      }),
    ).toContain(message);
    expect(
      errorsOf(UpdateCollaboratorDto, { profileUrl: 'https://github.com/ana' }),
    ).toEqual([]);
  });

  it.each([
    [
      RegisterDto,
      'fullName',
      { role: 'LIDER', email: 'a@b.co', password: 'Secret123*' },
    ],
    [CreateProjectDto, 'title', {}],
    [UpdateCollaboratorDto, 'firstName', {}],
    [UpdateProjectDto, 'objectives', {}],
  ] as const)(
    'rejects blank required text in %p.%s, like the Excel import',
    (type, field, rest) => {
      expect(errorsOf(type, { ...rest, [field]: '   ' })).toContain(
        `${field} es obligatorio`,
      );
    },
  );

  it('trims required text so the use case receives the clean value', () => {
    const dto = plainToInstance(UpdateCollaboratorDto, {
      firstName: '  Ana  ',
      summary: '   ',
      researchGroup: ' GIDIS ',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto).toEqual(
      expect.objectContaining({
        firstName: 'Ana',
        summary: null,
        researchGroup: 'GIDIS',
      }),
    );
  });

  it('reports length and type errors in Spanish', () => {
    expect(errorsOf(UpdateProjectDto, { title: 'ab' })).toContain(
      'title debe tener al menos 3 caracteres',
    );
    expect(
      errorsOf(UpdateCollaboratorDto, { researchGroup: 'g'.repeat(161) }),
    ).toContain('researchGroup admite máximo 160 caracteres');
    expect(errorsOf(UpdateCollaboratorDto, { firstName: 5 })).toContain(
      'firstName debe ser texto',
    );
    expect(errorsOf(UpdateCollaboratorDto, { summary: 5 })).toContain(
      'summary debe ser texto',
    );
  });

  it('accepts the field when it is simply not sent', () => {
    expect(errorsOf(UpdateCollaboratorDto, {})).toEqual([]);
    expect(errorsOf(UpdateUserDto, {})).toEqual([]);
  });

  it('only accepts known skill types in the search query', () => {
    expect(errorsOf(SearchSkillsQueryDto, { type: 'FOO' })).toContain('type');
    expect(errorsOf(SearchSkillsQueryDto, { q: 'react' })).toEqual([]);
  });
});
