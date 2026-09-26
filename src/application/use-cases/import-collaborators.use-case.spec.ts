import { BadRequestException } from '@nestjs/common';
import { ImportCollaboratorsUseCase } from './import-collaborators.use-case';
import {
  type CellValue,
  type CollaboratorWorkbook,
  type CollaboratorWorkbookReader,
  InvalidWorkbookError,
} from '../../domain/repositories/collaborator-workbook.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  buildExperience,
  buildProgram,
  buildSkill,
  createFakeUnitOfWork,
  createMock,
} from '../../testing/test-doubles.testing';

const collaboratorRow = (
  row: number,
  overrides: Record<string, CellValue> = {},
) => ({
  row,
  values: {
    correo: 'ana@example.com',
    nombres: 'Ana',
    apellidos: 'Pérez',
    tipo_persona: 'Estudiante',
    programa: '115',
    semestre: 7,
    semillero_o_grupo: 'GIDIS',
    resumen: null,
    enlace: null,
    disponibilidad: 'Parcial',
    horas_semana: 10,
    autoriza_datos: 'Sí',
    ...overrides,
  },
});

const skillRow = (row: number, overrides: Record<string, CellValue> = {}) => ({
  row,
  values: {
    correo: 'ana@example.com',
    habilidad: 'React',
    tipo: 'Conocimiento',
    categoria: null,
    nivel: 'Avanzado',
    meses_experiencia: 24,
    ultimo_uso: 2025,
    ...overrides,
  },
});

const experienceRow = (
  row: number,
  overrides: Record<string, CellValue> = {},
) => ({
  row,
  values: {
    correo: 'ana@example.com',
    tipo: 'Laboral',
    rol: 'Desarrolladora',
    organizacion: 'UFPS',
    fecha_inicio: new Date('2024-01-01'),
    fecha_fin: null,
    actual: 'Sí',
    horas_semana: 20,
    nivel: 'Intermedio',
    tecnologias: 'React, Docker',
    descripcion: null,
    ...overrides,
  },
});

describe('ImportCollaboratorsUseCase', () => {
  const workbookReader = createMock<CollaboratorWorkbookReader>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const programRepository = createMock<ProgramRepository>();
  const { unitOfWork, repositories } = createFakeUnitOfWork();
  const contextLogger = { error: jest.fn() };
  const appLogger = {
    forContext: () => contextLogger,
  } as unknown as AppLoggerService;

  const useCase = new ImportCollaboratorsUseCase(
    workbookReader,
    collaboratorRepository,
    programRepository,
    unitOfWork,
    appLogger,
  );

  const file = Buffer.from('xlsx');
  const givenWorkbook = (workbook: Partial<CollaboratorWorkbook>) =>
    workbookReader.read.mockResolvedValue({
      collaborators: [],
      skills: [],
      experience: [],
      ...workbook,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    programRepository.findByCodeOrName.mockResolvedValue(buildProgram());
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    repositories.collaborators.create.mockResolvedValue(buildCollaborator());
    repositories.skills.findByNormalizedNameOrSynonym.mockImplementation(
      (normalized) =>
        Promise.resolve(
          normalized === 'react' || normalized === 'reactjs'
            ? buildSkill()
            : null,
        ),
    );
    repositories.skills.create.mockImplementation((data) =>
      Promise.resolve(buildSkill({ id: `new-${data.name}`, name: data.name })),
    );
    repositories.collaboratorSkills.create.mockResolvedValue(
      buildCollaboratorSkill(),
    );
    repositories.experiences.create.mockResolvedValue(buildExperience());
  });

  it('imports a collaborator with skills and experience in one transaction', async () => {
    givenWorkbook({
      collaborators: [collaboratorRow(2)],
      skills: [skillRow(2)],
      experience: [experienceRow(2)],
    });

    const result = await useCase.execute(file);

    expect(result).toEqual({
      created: 1,
      rejected: [],
      warnings: ['Habilidad nueva creada como pendiente: "Docker"'],
    });
    expect(unitOfWork.run).toHaveBeenCalledTimes(1);
    expect(repositories.collaborators.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        programId: 'program-1',
        availabilityStatus: 'PARCIAL',
        weeklyHours: 10,
        dataConsent: true,
        dataConsentAt: expect.any(Date),
        source: 'IMPORTACION',
      }),
    );
    expect(repositories.experiences.create).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2024-01-01',
        current: true,
        skillIds: ['skill-1', 'new-Docker'],
      }),
    );
  });

  it('rejects invalid rows and keeps importing the rest', async () => {
    givenWorkbook({
      collaborators: [
        collaboratorRow(2, { horas_semana: 100 }),
        collaboratorRow(3, { correo: 'maria@example.com' }),
        collaboratorRow(4, { correo: 'maria@example.com' }),
      ],
    });

    const result = await useCase.execute(file);

    expect(result.created).toBe(1);
    expect(result.rejected).toEqual([
      {
        sheet: 'Colaboradores',
        row: 2,
        email: 'ana@example.com',
        reason: 'horas_semana debe ser un entero entre 0 y 60',
      },
      {
        sheet: 'Colaboradores',
        row: 4,
        email: 'maria@example.com',
        reason: 'Correo duplicado en el archivo',
      },
    ]);
  });

  it('rejects unknown programs and emails already registered', async () => {
    givenWorkbook({
      collaborators: [
        collaboratorRow(2),
        collaboratorRow(3, { correo: 'luis@example.com', programa: '%' }),
      ],
    });
    collaboratorRepository.findByEmail.mockResolvedValueOnce(
      buildCollaborator(),
    );
    programRepository.findByCodeOrName.mockImplementation((value) =>
      Promise.resolve(value === '%' ? null : buildProgram()),
    );

    const result = await useCase.execute(file);

    expect(result.created).toBe(0);
    expect(result.rejected.map(({ reason }) => reason)).toEqual([
      'El correo ya existe en la base de datos',
      'Programa no encontrado',
    ]);
  });

  it('reports a collaborator whose transaction fails instead of aborting the import', async () => {
    givenWorkbook({
      collaborators: [
        collaboratorRow(2),
        collaboratorRow(3, { correo: 'luis@example.com' }),
      ],
      skills: [skillRow(5)],
    });
    repositories.collaboratorSkills.create.mockRejectedValueOnce(
      new Error('smallint out of range'),
    );

    const result = await useCase.execute(file);

    expect(result.created).toBe(1);
    expect(result.rejected).toEqual([
      expect.objectContaining({
        sheet: 'Colaboradores',
        row: 2,
        reason:
          'No se pudo guardar el colaborador ni sus habilidades o experiencia',
      }),
      expect.objectContaining({
        sheet: 'Habilidades',
        row: 5,
        reason:
          'El correo no corresponde a un colaborador importado en este archivo',
      }),
    ]);
    expect(contextLogger.error).toHaveBeenCalled();
  });

  it('proposes a new skill with the category written in the sheet', async () => {
    givenWorkbook({
      collaborators: [collaboratorRow(2)],
      skills: [skillRow(2, { habilidad: 'Rust', categoria: 'Lenguaje' })],
    });

    await useCase.execute(file);

    expect(repositories.skills.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Rust', category: 'LENGUAJE' }),
    );
  });

  it('rejects a skill repeated for the same collaborator (name or synonym)', async () => {
    givenWorkbook({
      collaborators: [collaboratorRow(2)],
      skills: [skillRow(2), skillRow(3, { habilidad: 'ReactJS' })],
    });

    const result = await useCase.execute(file);

    expect(repositories.collaboratorSkills.create).toHaveBeenCalledTimes(1);
    expect(result.rejected).toEqual([
      {
        sheet: 'Habilidades',
        row: 3,
        email: 'ana@example.com',
        reason: 'Habilidad repetida para este colaborador: React',
      },
    ]);
  });

  it('rejects invalid child rows and orphan rows without losing them', async () => {
    givenWorkbook({
      collaborators: [collaboratorRow(2)],
      skills: [
        skillRow(2, { meses_experiencia: 99999 }),
        skillRow(3, { correo: 'nadie@example.com' }),
      ],
      experience: [experienceRow(2, { fecha_fin: new Date('2024-06-01') })],
    });

    const result = await useCase.execute(file);

    expect(result.created).toBe(1);
    expect(result.rejected).toEqual([
      expect.objectContaining({
        sheet: 'Habilidades',
        row: 2,
        reason: 'meses_experiencia debe ser un entero entre 0 y 600',
      }),
      expect.objectContaining({
        sheet: 'Experiencia',
        row: 2,
        reason: 'Una experiencia actual no debe tener fecha de fin',
      }),
      expect.objectContaining({
        sheet: 'Habilidades',
        row: 3,
        email: 'nadie@example.com',
        reason:
          'El correo no corresponde a un colaborador importado en este archivo',
      }),
    ]);
  });

  it('translates an unreadable workbook into a 400', async () => {
    workbookReader.read.mockRejectedValue(
      new InvalidWorkbookError('Falta la hoja "Habilidades"'),
    );

    await expect(useCase.execute(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('propagates unexpected reader errors', async () => {
    workbookReader.read.mockRejectedValue(new Error('disk'));

    await expect(useCase.execute(file)).rejects.toThrow('disk');
  });
});
