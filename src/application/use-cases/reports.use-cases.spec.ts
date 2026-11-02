import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ReportingRepository } from '../../domain/repositories/reporting.repository.interface';
import type { ReportWriter } from '../../domain/repositories/report-writer.interface';
import { createMock } from '../../testing/test-doubles.testing';
import { GenerateReportUseCase } from './generate-report.use-case';
import { GetPlatformStatsUseCase } from './get-platform-stats.use-case';

describe('RF15–RF16 stats and reports', () => {
  const repository = createMock<ReportingRepository>();
  const writer = createMock<ReportWriter>();
  const report = new GenerateReportUseCase(repository, writer);
  const now = new Date('2026-11-20T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    writer.write.mockResolvedValue(Buffer.from('file'));
  });

  it('delegates the stats to the reporting repository', async () => {
    repository.getStats.mockResolvedValue({ generatedAt: now } as never);
    await expect(
      new GetPlatformStatsUseCase(repository).execute(),
    ).resolves.toEqual({
      generatedAt: now,
    });
  });

  it('turns the dashboard filters into Colombian day bounds', async () => {
    repository.getStats.mockResolvedValue({ generatedAt: now } as never);
    await new GetPlatformStatsUseCase(repository).execute({
      from: '2026-11-01',
      to: '2026-11-30',
      projectTypeId: 'type-1',
      personType: 'DOCENTE',
    });
    expect(repository.getStats).toHaveBeenCalledWith(
      {
        from: new Date('2026-11-01T05:00:00Z'),
        to: new Date('2026-12-01T05:00:00Z'),
        projectTypeId: 'type-1',
        categoryId: undefined,
        programId: undefined,
        personType: 'DOCENTE',
      },
      expect.any(Date),
    );
  });

  it('rejects a start date after the end date', () => {
    const useCase = new GetPlatformStatsUseCase(repository);
    expect(() =>
      useCase.execute({ from: '2026-11-30', to: '2026-11-01' }),
    ).toThrow(UnprocessableEntityException);
    expect(repository.getStats).not.toHaveBeenCalled();
  });

  it('builds the skills report with offer, demand and ratio', async () => {
    repository.skillRows.mockResolvedValue([
      {
        skillId: 's1',
        name: 'Python',
        type: 'CONOCIMIENTO',
        offered: 3,
        demanded: 2,
      },
      {
        skillId: 's2',
        name: 'Liderazgo',
        type: 'HABILIDAD_BLANDA',
        offered: 4,
        demanded: 0,
      },
    ]);

    const result = await report.execute('habilidades', 'csv', now);

    expect(result).toMatchObject({
      fileName: 'reporte-habilidades-2026-11-20.csv',
      contentType: 'text/csv; charset=utf-8',
    });
    const [sheet, format] = writer.write.mock.calls[0];
    expect(format).toBe('csv');
    expect(sheet.subtitle).toContain('2 registros');
    const values = (sheet.rows as never[]).map((row) =>
      sheet.columns.map((column) => column.value(row)),
    );
    expect(values).toEqual([
      ['Python', 'Conocimiento técnico', 3, 2, 1.5],
      ['Liderazgo', 'Competencia blanda', 4, 0, null],
    ]);
  });

  it('defaults to Excel and translates enum values in the people report', async () => {
    repository.personRows.mockResolvedValue([
      {
        fullName: 'Ana Pérez',
        email: 'ana@ufps.edu.co',
        personType: 'ESTUDIANTE',
        program: 'Ingeniería de Sistemas',
        semester: 8,
        researchGroup: null,
        availabilityStatus: 'PARCIAL',
        weeklyHours: 10,
        skills: 4,
        experiences: 1,
        certificatesPending: 1,
        hasAccount: true,
        dataConsent: true,
        truthfulnessDeclared: true,
        active: true,
        source: 'IMPORTACION',
      },
    ]);

    const result = await report.execute('personas', undefined, now);

    expect(result.fileName).toBe('reporte-personas-2026-11-20.xlsx');
    const [sheet] = writer.write.mock.calls[0];
    const headers = sheet.columns.map((column) => column.header);
    expect(headers).not.toContain('Documento');
    expect(headers).not.toContain('Teléfono');
    const row = sheet.columns.map((column) =>
      column.value(sheet.rows[0] as never),
    );
    expect(row).toContain('Parcialmente disponible');
    expect(row).toContain('Importación');
  });

  it('returns 404 for an unknown report', async () => {
    await expect(report.execute('nominas')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
