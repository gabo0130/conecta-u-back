import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import {
  buildCollaborator,
  buildExperience,
  createFakeCertificateFiles,
  createMock,
} from '../../testing/test-doubles.testing';
import { DeleteMyExperienceCertificateUseCase } from './delete-my-experience-certificate.use-case';
import { GetExperienceCertificateUseCase } from './get-experience-certificate.use-case';
import { UploadMyExperienceCertificateUseCase } from './upload-my-experience-certificate.use-case';

const PDF = Buffer.from('%PDF-1.7 contenido');
const uploadedAt = new Date('2026-11-02T10:00:00Z');
const stored = {
  fileName: 'c.pdf',
  mimeType: 'application/pdf' as const,
  sizeBytes: PDF.length,
  uploadedAt,
};

describe('experience certificate use cases', () => {
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const { files, storage, repository } = createFakeCertificateFiles();
  const upload = new UploadMyExperienceCertificateUseCase(
    collaboratorRepository,
    repository,
    files,
  );
  const remove = new DeleteMyExperienceCertificateUseCase(
    collaboratorRepository,
    repository,
    files,
  );
  const get = new GetExperienceCertificateUseCase(
    collaboratorRepository,
    files,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    const collaborator = buildCollaborator({
      experiences: [
        buildExperience({ type: 'LABORAL' }),
        buildExperience({ id: 'exp-2', type: 'PROYECTO_ACADEMICO' }),
      ],
    });
    collaboratorRepository.findByUserId.mockResolvedValue(collaborator);
    collaboratorRepository.findById.mockResolvedValue(collaborator);
    repository.find.mockResolvedValue(null);
    repository.save.mockImplementation((_id, data) =>
      Promise.resolve({
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        uploadedAt,
      }),
    );
  });

  describe('upload', () => {
    it('stores the file in the bucket and only its metadata in the database', async () => {
      const result = await upload.execute('user-1', 'exp-1', {
        buffer: PDF,
        originalName: 'certificado.pdf',
      });

      const [key, content, type] = storage.put.mock.calls[0];
      expect(key).toMatch(/^certificates\/collab-1\/[0-9a-f-]{36}\.pdf$/);
      expect(content).toBe(PDF);
      expect(type).toBe('application/pdf');
      expect(repository.save).toHaveBeenCalledWith('exp-1', {
        fileName: 'certificado.pdf',
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
        storageKey: key,
      });
      expect(result.certificate).toEqual({
        fileName: 'certificado.pdf',
        mimeType: 'application/pdf',
        sizeBytes: PDF.length,
        uploadedAt,
      });
    });

    it('deletes the replaced file after saving the new one', async () => {
      repository.find.mockResolvedValue({ ...stored, storageKey: 'old-key' });
      await upload.execute('user-1', 'exp-1', { buffer: PDF });
      expect(storage.delete).toHaveBeenCalledWith('old-key');
    });

    it('removes the uploaded file when the database write fails', async () => {
      repository.save.mockRejectedValue(new Error('db down'));
      await expect(
        upload.execute('user-1', 'exp-1', { buffer: PDF }),
      ).rejects.toThrow('db down');
      expect(storage.delete).toHaveBeenCalledWith(storage.put.mock.calls[0][0]);
    });

    it('rejects a missing, oversized or fake file before touching the bucket', async () => {
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
      expect(storage.put).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('returns 404 for an experience of another person', async () => {
      await expect(
        upload.execute('user-1', 'foreign', { buffer: PDF }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('blocks removing the certificate of a work, internship or teaching experience', async () => {
      await expect(remove.execute('user-1', 'exp-1')).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deletes an optional certificate and its file', async () => {
      repository.find.mockResolvedValue({ ...stored, storageKey: 'key-2' });
      repository.delete.mockResolvedValue(true);
      await remove.execute('user-1', 'exp-2');
      expect(repository.delete).toHaveBeenCalledWith('exp-2');
      expect(storage.delete).toHaveBeenCalledWith('key-2');
    });

    it('returns 404 when there is nothing to delete or the experience is foreign', async () => {
      repository.delete.mockResolvedValue(false);
      await expect(remove.execute('user-1', 'exp-2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(remove.execute('user-1', 'foreign')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('download', () => {
    it('reads the file from the bucket for the owner and the admin', async () => {
      repository.find.mockResolvedValue({ ...stored, storageKey: 'key-1' });
      storage.get.mockResolvedValue(PDF);
      const expected = { ...stored, content: PDF };
      await expect(get.forOwner('user-1', 'exp-1')).resolves.toEqual(expected);
      await expect(get.forAdmin('collab-1', 'exp-1')).resolves.toEqual(
        expected,
      );
      expect(storage.get).toHaveBeenCalledWith('key-1');
    });

    it('reads a certificate uploaded before the bucket from the database', async () => {
      repository.find.mockResolvedValue({ ...stored, storageKey: null });
      repository.findLegacyContent.mockResolvedValue(PDF);
      await expect(get.forOwner('user-1', 'exp-1')).resolves.toEqual({
        ...stored,
        content: PDF,
      });
      expect(storage.get).not.toHaveBeenCalled();
    });

    it('returns 404 for a foreign experience, an unknown person or no file', async () => {
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
