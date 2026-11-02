import { CollaboratorExperienceController } from './collaborator-experience.controller';
import { CollaboratorProfileController } from './collaborator-profile.controller';
import { CollaboratorSkillsController } from './collaborator-skills.controller';
import type { AvailabilityDto } from '../../application/dto/availability.dto';
import type { CollaboratorSkillDto } from '../../application/dto/collaborator-skill.dto';
import type { CreateMyCollaboratorDto } from '../../application/dto/create-my-collaborator.dto';
import type { ExperienceDto } from '../../application/dto/experience.dto';
import type { AddMyCollaboratorSkillUseCase } from '../../application/use-cases/add-my-collaborator-skill.use-case';
import type { CreateMyCollaboratorProfileUseCase } from '../../application/use-cases/create-my-collaborator-profile.use-case';
import type { CreateMyExperienceUseCase } from '../../application/use-cases/create-my-experience.use-case';
import type { DeleteMyCollaboratorSkillUseCase } from '../../application/use-cases/delete-my-collaborator-skill.use-case';
import type { DeleteMyExperienceUseCase } from '../../application/use-cases/delete-my-experience.use-case';
import type { GetMyCollaboratorProfileUseCase } from '../../application/use-cases/get-my-collaborator-profile.use-case';
import type { ListMyCollaboratorSkillsUseCase } from '../../application/use-cases/list-my-collaborator-skills.use-case';
import type { UpdateMyAvailabilityUseCase } from '../../application/use-cases/update-my-availability.use-case';
import type { UpdateMyCollaboratorProfileUseCase } from '../../application/use-cases/update-my-collaborator-profile.use-case';
import type { UpdateMyCollaboratorSkillUseCase } from '../../application/use-cases/update-my-collaborator-skill.use-case';
import type { UpdateMyExperienceUseCase } from '../../application/use-cases/update-my-experience.use-case';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';
import type { DeleteMyExperienceCertificateUseCase } from '../../application/use-cases/delete-my-experience-certificate.use-case';
import type { GetExperienceCertificateUseCase } from '../../application/use-cases/get-experience-certificate.use-case';
import type { UploadMyExperienceCertificateUseCase } from '../../application/use-cases/upload-my-experience-certificate.use-case';
import { createMock } from '../../testing/test-doubles.testing';

const request = {
  user: { userId: 'user-1', role: 'COLABORADOR' },
} as AuthenticatedRequest;

describe('CollaboratorProfileController', () => {
  const create = createMock<CreateMyCollaboratorProfileUseCase>();
  const get = createMock<GetMyCollaboratorProfileUseCase>();
  const update = createMock<UpdateMyCollaboratorProfileUseCase>();
  const availability = createMock<UpdateMyAvailabilityUseCase>();
  const controller = new CollaboratorProfileController(
    create,
    get,
    update,
    availability,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates each route to its use case with the authenticated user', () => {
    const createDto = { firstName: 'Ana' } as CreateMyCollaboratorDto;
    const availabilityDto: AvailabilityDto = {
      availabilityStatus: 'PARCIAL',
      weeklyHours: 10,
    };

    void controller.create(request, createDto);
    void controller.get(request);
    void controller.update(request, {
      summary: 'x',
      truthfulnessDeclared: true,
    });
    void controller.updateAvailability(request, availabilityDto);

    expect(create.execute).toHaveBeenCalledWith('user-1', createDto);
    expect(get.execute).toHaveBeenCalledWith('user-1');
    expect(update.execute).toHaveBeenCalledWith('user-1', {
      summary: 'x',
      truthfulnessDeclared: true,
    });
    expect(availability.execute).toHaveBeenCalledWith(
      'user-1',
      availabilityDto,
    );
  });
});

describe('CollaboratorSkillsController', () => {
  const list = createMock<ListMyCollaboratorSkillsUseCase>();
  const add = createMock<AddMyCollaboratorSkillUseCase>();
  const update = createMock<UpdateMyCollaboratorSkillUseCase>();
  const remove = createMock<DeleteMyCollaboratorSkillUseCase>();
  const controller = new CollaboratorSkillsController(
    list,
    add,
    update,
    remove,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates each route to its use case with the authenticated user', () => {
    const dto: CollaboratorSkillDto = {
      skillId: 'skill-1',
      level: 'BASICO',
      experienceMonths: 1,
    };

    void controller.list(request);
    void controller.add(request, dto);
    void controller.update(request, 'entry-1', dto);
    void controller.delete(request, 'entry-1');

    expect(list.execute).toHaveBeenCalledWith('user-1');
    expect(add.execute).toHaveBeenCalledWith('user-1', dto);
    expect(update.execute).toHaveBeenCalledWith('user-1', 'entry-1', dto);
    expect(remove.execute).toHaveBeenCalledWith('user-1', 'entry-1');
  });
});

describe('CollaboratorExperienceController', () => {
  const create = createMock<CreateMyExperienceUseCase>();
  const update = createMock<UpdateMyExperienceUseCase>();
  const remove = createMock<DeleteMyExperienceUseCase>();
  const upload = createMock<UploadMyExperienceCertificateUseCase>();
  const removeCertificate = createMock<DeleteMyExperienceCertificateUseCase>();
  const getCertificate = createMock<GetExperienceCertificateUseCase>();
  const controller = new CollaboratorExperienceController(
    create,
    update,
    remove,
    upload,
    removeCertificate,
    getCertificate,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates each route to its use case with the authenticated user', () => {
    const dto = { role: 'Dev' } as ExperienceDto;

    void controller.create(request, dto);
    void controller.update(request, 'exp-1', dto);
    void controller.delete(request, 'exp-1');

    expect(create.execute).toHaveBeenCalledWith('user-1', dto);
    expect(update.execute).toHaveBeenCalledWith('user-1', 'exp-1', dto);
    expect(remove.execute).toHaveBeenCalledWith('user-1', 'exp-1');
  });

  it('delegates the certificate routes with the uploaded file', async () => {
    const res = { set: jest.fn(), send: jest.fn() };
    getCertificate.forOwner.mockResolvedValue({
      fileName: 'cert.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 5,
      uploadedAt: new Date(),
      content: Buffer.from('%PDF-'),
    });

    void controller.uploadCertificate(request, 'exp-1', {
      buffer: Buffer.from('%PDF-'),
      originalname: 'cert.pdf',
    } as Express.Multer.File);
    void controller.uploadCertificate(request, 'exp-1', undefined);
    void controller.deleteCertificate(request, 'exp-1');
    await controller.downloadCertificate(
      request,
      'exp-1',
      res as unknown as import('express').Response,
    );

    expect(upload.execute).toHaveBeenNthCalledWith(1, 'user-1', 'exp-1', {
      buffer: Buffer.from('%PDF-'),
      originalName: 'cert.pdf',
    });
    expect(upload.execute).toHaveBeenNthCalledWith(
      2,
      'user-1',
      'exp-1',
      undefined,
    );
    expect(removeCertificate.execute).toHaveBeenCalledWith('user-1', 'exp-1');
    expect(getCertificate.forOwner).toHaveBeenCalledWith('user-1', 'exp-1');
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
      }),
    );
    expect(res.send).toHaveBeenCalled();
  });
});
