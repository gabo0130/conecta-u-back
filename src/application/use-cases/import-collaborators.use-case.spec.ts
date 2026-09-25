import { BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ImportCollaboratorsUseCase } from './import-collaborators.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { ProgramEntity } from '../../domain/entities/program.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  COLLABORATOR_HEADERS,
  EXPERIENCE_HEADERS,
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_SKILLS,
  SKILL_HEADERS,
} from '../../shared/constants/import-collaborators.constants';

interface BuildWorkbookOptions {
  collaborators?: Record<string, unknown>[];
  skills?: Record<string, unknown>[];
  experience?: Record<string, unknown>[];
  skipSheet?: string;
}

async function buildWorkbookBuffer(
  options: BuildWorkbookOptions,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  if (options.skipSheet !== SHEET_COLLABORATORS) {
    const sheet = workbook.addWorksheet(SHEET_COLLABORATORS);
    sheet.columns = COLLABORATOR_HEADERS.map((header) => ({
      header,
      key: header,
    }));
    (options.collaborators ?? []).forEach((row) => sheet.addRow(row));
  }
  if (options.skipSheet !== SHEET_SKILLS) {
    const sheet = workbook.addWorksheet(SHEET_SKILLS);
    sheet.columns = SKILL_HEADERS.map((header) => ({ header, key: header }));
    (options.skills ?? []).forEach((row) => sheet.addRow(row));
  }
  if (options.skipSheet !== SHEET_EXPERIENCE) {
    const sheet = workbook.addWorksheet(SHEET_EXPERIENCE);
    sheet.columns = EXPERIENCE_HEADERS.map((header) => ({
      header,
      key: header,
    }));
    (options.experience ?? []).forEach((row) => sheet.addRow(row));
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function buildFile(buffer: Buffer): Express.Multer.File {
  return { buffer, size: buffer.length } as unknown as Express.Multer.File;
}

describe('ImportCollaboratorsUseCase', () => {
  const collaboratorRepository: jest.Mocked<
    Pick<CollaboratorRepository, 'findByEmail' | 'create' | 'update'>
  > = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const programRepository: jest.Mocked<
    Pick<ProgramRepository, 'findByCodeOrName'>
  > = {
    findByCodeOrName: jest.fn(),
  };
  const skillRepository: jest.Mocked<
    Pick<SkillRepository, 'findByNormalizedNameOrSynonym' | 'create'>
  > = {
    findByNormalizedNameOrSynonym: jest.fn(),
    create: jest.fn(),
  };
  const collaboratorSkillRepository: jest.Mocked<
    Pick<CollaboratorSkillRepository, 'create'>
  > = {
    create: jest.fn(),
  };
  const experienceRepository: jest.Mocked<
    Pick<ExperienceRepository, 'create'>
  > = {
    create: jest.fn(),
  };

  const useCase = new ImportCollaboratorsUseCase(
    collaboratorRepository,
    programRepository,
    skillRepository,
    collaboratorSkillRepository,
    experienceRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports a valid collaborator with a skill and an experience', async () => {
    const buffer = await buildWorkbookBuffer({
      collaborators: [
        {
          correo: 'ana@example.com',
          nombres: 'Ana',
          apellidos: 'Gómez',
          tipo_persona: 'Estudiante',
          programa: 'ISI',
          semestre: 7,
          semillero_o_grupo: 'Grupo A',
          resumen: 'Resumen',
          enlace: 'https://ana.dev',
          disponibilidad: 'Disponible',
          horas_semana: 10,
          autoriza_datos: 'Sí',
        },
      ],
      skills: [
        {
          correo: 'ana@example.com',
          habilidad: 'React',
          tipo: 'Conocimiento',
          nivel: 'Avanzado',
          meses_experiencia: 12,
          ultimo_uso: 2026,
        },
      ],
      experience: [
        {
          correo: 'ana@example.com',
          tipo: 'Practica',
          rol: 'Dev',
          organizacion: 'Empresa',
          fecha_inicio: '2025-01-01',
          fecha_fin: '2025-06-01',
          actual: 'No',
          horas_semana: 10,
          nivel: 'Intermedio',
          tecnologias: 'React',
          descripcion: 'Descripción',
        },
      ],
    });

    programRepository.findByCodeOrName.mockResolvedValue(
      new ProgramEntity('prog-1', 'ISI', 'Ingeniería de Sistemas'),
    );
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.create.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        null,
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
      ),
    );
    skillRepository.findByNormalizedNameOrSynonym.mockResolvedValue(
      new SkillEntity('s1', 'React', 'react', 'CONOCIMIENTO'),
    );

    const result = await useCase.execute(buildFile(buffer));

    expect(result.created).toBe(1);
    expect(result.rejected).toEqual([]);
    expect(collaboratorRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ana@example.com',
        source: 'IMPORTACION',
      }),
    );
    expect(collaboratorSkillRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collaboratorId: 'c1',
        skillId: 's1',
        level: 'AVANZADO',
      }),
    );
    expect(experienceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collaboratorId: 'c1',
        role: 'Dev',
        skillIds: ['s1'],
      }),
    );
  });

  it('rejects a row with an invalid tipo_persona', async () => {
    const buffer = await buildWorkbookBuffer({
      collaborators: [
        {
          correo: 'bad@example.com',
          nombres: 'B',
          apellidos: 'C',
          tipo_persona: 'Alien',
          programa: 'ISI',
          disponibilidad: 'Disponible',
          horas_semana: 10,
          autoriza_datos: 'Sí',
        },
      ],
    });

    const result = await useCase.execute(buildFile(buffer));

    expect(result.created).toBe(0);
    expect(result.rejected).toEqual([
      {
        sheet: SHEET_COLLABORATORS,
        row: 2,
        email: 'bad@example.com',
        reason: 'tipo_persona inválido',
      },
    ]);
  });

  it('rejects a row when the program does not exist', async () => {
    const buffer = await buildWorkbookBuffer({
      collaborators: [
        {
          correo: 'ana@example.com',
          nombres: 'Ana',
          apellidos: 'Gómez',
          tipo_persona: 'Estudiante',
          programa: 'NOPE',
          disponibilidad: 'Disponible',
          horas_semana: 10,
          autoriza_datos: 'Sí',
        },
      ],
    });
    programRepository.findByCodeOrName.mockResolvedValue(null);

    const result = await useCase.execute(buildFile(buffer));

    expect(result.rejected[0].reason).toBe('Programa no encontrado');
  });

  it('proposes a new skill and records a warning when it does not exist in the catalog', async () => {
    const buffer = await buildWorkbookBuffer({
      collaborators: [
        {
          correo: 'ana@example.com',
          nombres: 'Ana',
          apellidos: 'Gómez',
          tipo_persona: 'Estudiante',
          programa: 'ISI',
          disponibilidad: 'Disponible',
          horas_semana: 10,
          autoriza_datos: 'Sí',
        },
      ],
      skills: [
        {
          correo: 'ana@example.com',
          habilidad: 'Rust',
          tipo: 'Conocimiento',
          nivel: 'Basico',
          meses_experiencia: 3,
        },
      ],
    });

    programRepository.findByCodeOrName.mockResolvedValue(
      new ProgramEntity('prog-1', 'ISI', 'Ingeniería de Sistemas'),
    );
    collaboratorRepository.findByEmail.mockResolvedValue(null);
    collaboratorRepository.create.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'ana@example.com',
        null,
        'Ana',
        'Gómez',
        'ESTUDIANTE',
        'prog-1',
      ),
    );
    skillRepository.findByNormalizedNameOrSynonym.mockResolvedValue(null);
    skillRepository.create.mockResolvedValue(
      new SkillEntity(
        's2',
        'Rust',
        'rust',
        'CONOCIMIENTO',
        'OTRA',
        [],
        'PENDIENTE',
      ),
    );

    const result = await useCase.execute(buildFile(buffer));

    expect(result.warnings).toHaveLength(1);
    expect(skillRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Rust', status: 'PENDIENTE' }),
    );
  });

  it('rejects the whole file when it exceeds the size limit', async () => {
    const file = {
      buffer: Buffer.from(''),
      size: 10 * 1024 * 1024,
    } as unknown as Express.Multer.File;

    await expect(useCase.execute(file)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects the whole file when a required sheet is missing', async () => {
    const buffer = await buildWorkbookBuffer({ skipSheet: SHEET_EXPERIENCE });

    await expect(useCase.execute(buildFile(buffer))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
