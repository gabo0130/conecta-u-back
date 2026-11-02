import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceCertificateRepository } from '../../domain/repositories/experience-certificate.repository.interface';
import {
  buildCollaborator,
  buildExperience,
  createMock,
} from '../../testing/test-doubles.testing';
import { DeleteMyExperienceCertificateUseCase } from './delete-my-experience-certificate.use-case';
import { GetExperienceCertificateUseCase } from './get-experience-certificate.use-case';
import { UploadMyExperienceCertificateUseCase } from './upload-my-experience-certificate.use-case';

const PDF = Buffer.from('%PDF-1.7 contenido');
const uploadedAt = new Date('2026-11-02T10:00:00Z');

describe('experience certificate use cases', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const certificateRepository = createMock<ExperienceCertificateRepository>();
  const upload = new UploadMyExperienceCertificateUseCase(
    collaboratorRepository,
    certificateRepository,
  );
  const remove = new DeleteMyExperienceCertificateUseCase(
    collaboratorRepository,
    certificateRepository,
  );
  const get = new GetExperienceCertificateUseCase(
    collaboratorRepository,
    certificateRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    const collaborator = buildCollaborator({
      experiences: [buildExperience({ type: 'LABORAL' })],
    });
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    collaboratorRepository.findById.mockResolvedValue(collaborator);
    certificateRepository.save.mockImplementation((_id, data) =>
      Promise.resolve({
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.content.length,
        uploadedAt,
      }),
    );
  });

  describe('upload', () => {
    it('saves a PDF of an owned experience and returns it with its certificate', async () => {
      const result = await upload.execute('user-1', 'exp-1', {
        buffer: PDF,
        originalName: 'certificado.pdf',
      });

      expect(certificateRepository.save).toHaveBeenCalledWith('exp-1', {
        fileName: 'certificado.pdf',
        mimeType: 'application/pdf',
        content: PDF,
      });
      expect(result.certificate).toEqual({
        fileName: 'certificado.pdf',
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
        uploadedAt,
      });
      expect(result.certificateRequired).toBe(true);
    });

    it('rejects a missing, oversized or fake file', async () => {
      await expect(
        upload.execute('user-1', 'exp-1', undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        upload.execute('user-1', 'exp-1', {
          buffer: Buffer.concat([PDF, Buffer.alloc(2 * 1024 * 1024)]),
        }),
      ).rejects.toBeInstanceOf(PayloadTooLargeException);
      await expect(
        upload.execute('user-1', 'exp-1', {
          buffer: Buffer.from('<script>alert(1)</script>'),
          originalName: 'x.pdf',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(certificateRepository.save).not.toHaveBeenCalled();
    });

    it('returns 404 for an experience of another person', async () => {
      await expect(
        upload.execute('user-1', 'foreign', { buffer: PDF }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes the certificate of an owned experience', async () => {
      certificateRepository.delete.mockResolvedValue(true);
      await remove.execute('user-1', 'exp-1');
      expect(certificateRepository.delete).toHaveBeenCalledWith('exp-1');
    });

    it('returns 404 when there is nothing to delete or the experience is foreign', async () => {
      certificateRepository.delete.mockResolvedValue(false);
      await expect(remove.execute('user-1', 'exp-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(remove.execute('user-1', 'foreign')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('download', () => {
    const file = {
      fileName: 'c.pdf',
      mimeType: 'application/pdf' as const,
      sizeBytes: PDF.length,
      uploadedAt,
      content: PDF,
    };

    it('lets the owner and the admin read it', async () => {
      certificateRepository.findFile.mockResolvedValue(file);
      await expect(get.forOwner('user-1', 'exp-1')).resolves.toBe(file);
      await expect(get.forAdmin('collab-1', 'exp-1')).resolves.toBe(file);
    });

    it('returns 404 for a foreign experience, an unknown person or no file', async () => {
      certificateRepository.findFile.mockResolvedValue(null);
      await expect(get.forOwner('user-1', 'exp-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(get.forOwner('user-1', 'foreign')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      collaboratorRepository.findById.mockResolvedValue(null);
      await expect(get.forAdmin('nobody', 'exp-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
