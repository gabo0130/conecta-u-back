import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateMyExperienceUseCase } from './update-my-experience.use-case';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { ExperienceDto } from '../dto/experience.dto';
import {
  buildCollaborator,
  buildExperience,
  createFakeCertificateFiles,
  createFakeUnitOfWork,
  createMock,
} from '../../testing/test-doubles.testing';

const uploadedAt = new Date('2026-11-02T10:00:00Z');
const certificate = {
  fileName: 'c.pdf',
  mimeType: 'application/pdf' as const,
  sizeBytes: 10,
  uploadedAt,
};

describe('UpdateMyExperienceUseCase', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const skillRepository = createMock<SkillRepository>();
  const { unitOfWork, repositories } = createFakeUnitOfWork();
  const experienceRepository = repositories.experiences;
  const { files, storage, repository } = createFakeCertificateFiles();
  const useCase = new UpdateMyExperienceUseCase(
    collaboratorRepository,
    skillRepository,
    unitOfWork,
    files,
  );

  const dto: ExperienceDto = {
    type: 'PRACTICA',
    role: 'Practicante',
    organization: 'UFPS',
    startDate: '2025-01-01',
    current: true,
    weeklyHours: 30,
    level: 'AVANZADO',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({ experiences: [buildExperience({ certificate })] }),
    );
    repository.find.mockResolvedValue(null);
    repositories.certificates.save.mockResolvedValue(certificate);
    experienceRepository.update.mockResolvedValue(
      buildExperience({ current: true, endDate: null }),
    );
  });

  it('updates an owned experience', async () => {
    const result = await useCase.execute('user-1', 'exp-1', dto);

    expect(experienceRepository.update).toHaveBeenCalledWith(
      'exp-1',
      expect.objectContaining({ role: 'Practicante', endDate: null }),
    );
    expect(result.id).toBe('exp-1');
  });

  it('requires a certificate when an experience without one becomes a work experience', async () => {
    collaboratorRepository.findByUserId.mockResolvedValue(
      buildCollaborator({
        experiences: [buildExperience({ type: 'VOLUNTARIADO' })],
      }),
    );
    await expect(
      useCase.execute('user-1', 'exp-1', { ...dto, type: 'LABORAL' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(experienceRepository.update).not.toHaveBeenCalled();
  });

  it('replaces the certificate and deletes the old file', async () => {
    repository.find.mockResolvedValue({ ...certificate, storageKey: 'old' });
    await useCase.execute('user-1', 'exp-1', dto, {
      buffer: Buffer.from('%PDF-1.7 nuevo'),
    });
    expect(repositories.certificates.save).toHaveBeenCalledWith(
      'exp-1',
      expect.objectContaining({ storageKey: storage.put.mock.calls[0][0] }),
    );
    expect(storage.delete).toHaveBeenCalledWith('old');
  });

  it('returns 404 for an experience of another collaborator', async () => {
    await expect(
      useCase.execute('user-1', 'foreign-exp', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(experienceRepository.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid period', async () => {
    await expect(
      useCase.execute('user-1', 'exp-1', { ...dto, endDate: '2025-06-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 when the experience disappears while updating', async () => {
    experienceRepository.update.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', 'exp-1', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
