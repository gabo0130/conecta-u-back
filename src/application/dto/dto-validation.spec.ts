import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CollaboratorSkillDto } from './collaborator-skill.dto';
import { CreateProjectDto } from './create-project.dto';
import { ExperienceDto } from './experience.dto';
import { UpdateIdentificationDto } from './person-identification.dto';
import { CreateUserDto } from './create-user.dto';
import {
  AccountPersonDto,
  RegisterCollaboratorDto,
  RegisterDto,
} from './register.dto';
import { SearchSkillsQueryDto } from './search-skills-query.dto';
import { UpdateCollaboratorDto } from './update-collaborator.dto';
import { UpdateProjectDto } from './update-project.dto';
import { UpdateUserDto } from './update-user.dto';

const errorsOf = (type: new () => object, plain: Record<string, unknown>) =>
  validateSync(plainToInstance(type, plain)).flatMap((error) => [
    error.property,
    ...Object.values(error.constraints ?? {}),
  ]);

// «Mi perfil» siempre manda la declaración de veracidad (v2.2, E2).
const DECLARED = { truthfulnessDeclared: true };

describe('DTO validation', () => {
  const register = {
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    password: 'Secret123*',
  };

  it.each(['COLABORADOR', 'LIDER'])(
    'requires the person data when registering a %s (v2.1)',
    (role) => {
      expect(errorsOf(RegisterDto, { ...register, role })).toContain(
        'Los datos de la persona son obligatorios',
      );
    },
  );

  describe('declaración de veracidad (v2.2, E2)', () => {
    const person = {
      firstName: 'Ana',
      lastName: 'Pérez',
      personType: 'ESTUDIANTE',
      programId: '3f1c2a8e-1b2c-4d5e-8f90-123456789abc',
      documentType: 'CC',
      documentNumber: '1090123456',
      phone: '3001234567',
      nationality: 'Colombiana',
    };
    const message = 'Debes declarar que la información es verídica.';

    it.each([undefined, false, 'true'])(
      'rejects the register and «Mi perfil» without a true declaration (%p)',
      (truthfulnessDeclared) => {
        for (const [type, plain] of [
          [RegisterCollaboratorDto, person],
          [UpdateCollaboratorDto, { summary: 'x' }],
        ] as const) {
          expect(errorsOf(type, { ...plain, truthfulnessDeclared })).toContain(
            message,
          );
        }
      },
    );

    it('accepts it when declared', () => {
      expect(
        errorsOf(RegisterCollaboratorDto, {
          ...person,
          truthfulnessDeclared: true,
        }),
      ).toEqual([]);
    });

    it('does not ask for it when the ADMIN creates the account', () => {
      expect(errorsOf(AccountPersonDto, person)).toEqual([]);
      expect(
        errorsOf(CreateUserDto, {
          fullName: 'Ana Pérez',
          email: 'ana@example.com',
          password: 'Secret123*',
          role: 'COLABORADOR',
          collaborator: person,
        }),
      ).toEqual([]);
    });
  });

  describe('entidades y duración del proyecto (v2.2, E5)', () => {
    const project = {
      title: 'Conecta U',
      summary: 'Resumen',
      objectives: 'Objetivos',
      typeId: '3f1c2a8e-1b2c-4d5e-8f90-123456789abc',
      categoryId: '3f1c2a8e-1b2c-4d5e-8f90-123456789abd',
      deliverables: [{ name: 'PMV', scope: 'Iteración 2' }],
      executingEntity: ' UFPS ',
      durationMonths: 6,
    };
    const duration =
      'La duración debe ser un número entero de meses entre 1 y 60';

    it('requires the executing entity and the duration; the sponsor is optional', () => {
      expect(errorsOf(CreateProjectDto, project)).toEqual([]);
      const { executingEntity, durationMonths, ...rest } = project;
      void executingEntity;
      void durationMonths;
      const errors = errorsOf(CreateProjectDto, rest);
      expect(errors).toContain('executingEntity es obligatorio');
      expect(errors).toContain(duration);
    });

    it.each([0, 61, 2.5, '6'])('rejects a duration of %p months', (value) => {
      expect(
        errorsOf(CreateProjectDto, { ...project, durationMonths: value }),
      ).toContain(duration);
    });

    it('limits the entities to 150 characters and trims them', () => {
      expect(
        errorsOf(CreateProjectDto, {
          ...project,
          sponsorEntity: 'x'.repeat(151),
        }),
      ).toContain('sponsorEntity');
      const dto = plainToInstance(CreateProjectDto, {
        ...project,
        sponsorEntity: '   ',
      });
      expect(validateSync(dto)).toEqual([]);
      expect(dto.executingEntity).toBe('UFPS');
      expect(dto.sponsorEntity).toBeNull();
    });

    it('lets an update leave them untouched but not clear the required ones', () => {
      expect(errorsOf(UpdateProjectDto, {})).toEqual([]);
      expect(errorsOf(UpdateProjectDto, { sponsorEntity: null })).toEqual([]);
      expect(errorsOf(UpdateProjectDto, { executingEntity: null })).toContain(
        'executingEntity',
      );
      expect(errorsOf(UpdateProjectDto, { durationMonths: null })).toContain(
        'durationMonths',
      );
    });
  });

  describe('identificación (v2.1, A1–A4)', () => {
    const person = {
      firstName: 'Ana',
      lastName: 'Pérez',
      personType: 'ESTUDIANTE',
      programId: '3f1c2a8e-1b2c-4d5e-8f90-123456789abc',
      documentType: 'CC',
      documentNumber: ' 1.090.123.456 ',
      phone: '(+57) 300 123-4567',
      nationality: 'Colombiana',
    };

    it('normalizes the document and the phone before validating', () => {
      const dto = plainToInstance(AccountPersonDto, person);
      expect(validateSync(dto)).toEqual([]);
      expect(dto.documentNumber).toBe('1090123456');
      expect(dto.phone).toBe('+573001234567');
    });

    it.each([
      [
        { documentType: 'NIT' },
        'documentType debe ser uno de: CC, TI, CE, PPT, PA',
      ],
      [
        { documentNumber: 'AB123' },
        'El número de cédula de ciudadanía debe tener solo dígitos (entre 5 y 15)',
      ],
      [
        { phone: '123' },
        'El teléfono debe tener entre 7 y 15 dígitos (puede empezar con +)',
      ],
      [{ nationality: '  ' }, 'nationality es obligatorio'],
      [{ alternateEmail: 'no-correo' }, 'Formato de correo alterno inválido'],
    ])('rejects %p', (override, message) => {
      expect(errorsOf(AccountPersonDto, { ...person, ...override })).toContain(
        message,
      );
    });

    it('accepts alphanumeric passports and empty optional contact fields', () => {
      expect(
        errorsOf(AccountPersonDto, {
          ...person,
          documentType: 'PA',
          documentNumber: 'ab-123456',
          alternateEmail: '',
          institutionalCode: '',
        }),
      ).toEqual([]);
    });

    it('lets the admin send only part of the identification', () => {
      expect(
        errorsOf(UpdateIdentificationDto, { phone: '3001234567' }),
      ).toEqual([]);
      expect(
        errorsOf(UpdateIdentificationDto, { documentType: null }),
      ).toContain('documentType no puede ser nulo');
    });
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
        ...DECLARED,
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
      errorsOf(UpdateCollaboratorDto, {
        ...DECLARED,
        profileUrl: 'https://github.com/ana',
      }),
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
      ...DECLARED,
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
    expect(errorsOf(UpdateCollaboratorDto, DECLARED)).toEqual([]);
    expect(errorsOf(UpdateUserDto, {})).toEqual([]);
  });

  it('only accepts known skill types in the search query', () => {
    expect(errorsOf(SearchSkillsQueryDto, { type: 'FOO' })).toContain('type');
    expect(errorsOf(SearchSkillsQueryDto, { q: 'react' })).toEqual([]);
  });
});
