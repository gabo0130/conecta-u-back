import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateMyExperienceUseCase } from './create-my-experience.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { ExperienceDto } from '../dto/experience.dto';
import {
  buildCollaborator,
  buildExperience,
  buildSkill,
  createFakeCertificateFiles,
  createFakeUnitOfWork,
  createMock,
} from '../../testing/test-doubles.testing';

const PDF = {
  buffer: Buffer.from('%PDF-1.7 certificado'),
  originalName: 'c.pdf',
};
const uploadedAt = new Date('2026-11-02T10:00:00Z');

describe('CreateMyExperienceUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const skillRepository = createMock<SkillRepository>();
  const { unitOfWork, repositories } = createFakeUnitOfWork();
  const experienceRepository = repositories.experiences;
  const { files, storage } = createFakeCertificateFiles();
  const useCase = new CreateMyExperienceUseCase(
    collaboratorRepository,
    skillRepository,
    unitOfWork,
    files,
  );

  const dto: ExperienceDto = {
    type: 'LABORAL',
    role: 'Desarrolladora',
    organization: 'UFPS',
    startDate: '2024-01-01',
    endDate: '2024-07-01',
    current: false,
    weeklyHours: 20,
    level: 'INTERMEDIO',
    skillIds: ['skill-1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(buildCollaborator());
    skillRepository.findByIds.mockResolvedValue([buildSkill()]);
    experienceRepository.create.mockResolvedValue(buildExperience());
    repositories.certificates.save.mockImplementation((_id, data) =>
      Promise.resolve({
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        uploadedAt,
      }),
    );
  });

  it('creates the experience with its certificate in one operation', async () => {
    const result = await useCase.execute('user-1', dto, PDF);

    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(repositories.certificates.save).toHaveBeenCalledWith(
      'exp-1',
      expect.objectContaining({ storageKey: storage.put.mock.calls[0][0] }),
    );
    expect(result.certificate).toEqual(
      expect.objectContaining({ fileName: 'c.pdf' }),
    );

    expect(experienceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collaboratorId: 'collab-1',
        skillIds: ['skill-1'],
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        durationMonths: 6,
        technologies: [{ id: 'skill-1', name: 'React' }],
      }),
    );
  });

  it('blocks a work experience without certificate or with a fake file', async () => {
    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      useCase.execute('user-1', dto, {
        buffer: Buffer.from('texto renombrado'),
        originalName: 'falso.pdf',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(storage.put).not.toHaveBeenCalled();
    expect(experienceRepository.create).not.toHaveBeenCalled();
  });

  it('creates an academic project experience without certificate', async () => {
    await useCase.execute('user-1', { ...dto, type: 'PROYECTO_ACADEMICO' });
    expect(experienceRepository.create).toHaveBeenCalled();
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('removes the uploaded file when the experience cannot be saved', async () => {
    experienceRepository.create.mockRejectedValue(new Error('db down'));
    await expect(useCase.execute('user-1', dto, PDF)).rejects.toThrow(
      'db down',
    );
    expect(storage.delete).toHaveBeenCalledWith(storage.put.mock.calls[0][0]);
  });

  it('rejects technologies that are not in the catalog', async () => {
    skillRepository.findByIds.mockResolvedValue([]);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(experienceRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      useCase.execute('user-1', { ...dto, endDate: '2023-12-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a current experience with an end date', async () => {
    await expect(
      useCase.execute('user-1', { ...dto, current: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a user without profile', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
