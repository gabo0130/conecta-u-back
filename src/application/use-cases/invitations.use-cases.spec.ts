import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { InvitationRepository } from '../../domain/repositories/invitation.repository.interface';
import type { MailSender } from '../../domain/repositories/mail-sender.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type {
  RecommendationRepository,
  RecommendationView,
} from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import {
  buildCollaborator,
  buildProject,
  buildRequiredProfile,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';
import { ListInvitationsUseCase } from './list-invitations.use-case';
import {
  NOT_RECOMMENDED,
  SendInvitationsUseCase,
} from './send-invitations.use-case';

const view = (collaboratorId: string, requiredProfileId = 'rp1') =>
  ({
    id: `rec-${collaboratorId}`,
    requiredProfileId,
    collaborator: { id: collaboratorId },
  }) as RecommendationView;

describe('invitations (RF21–RF22)', () => {
  const projectRepository = createMock<ProjectRepository>();
  const recommendationRepository = createMock<RecommendationRepository>();
  const collaboratorRepository = createMock<CollaboratorRepository>();
  const userRepository = createMock<UserRepository>();
  const invitationRepository = createMock<InvitationRepository>();
  const requiredProfileRepository = createMock<RequiredProfileRepository>();
  const mailSender = createMock<MailSender>();
  const contextLogger = { info: jest.fn(), error: jest.fn() };
  const appLogger = {
    forContext: () => contextLogger,
  } as unknown as AppLoggerService;
  const send = new SendInvitationsUseCase(
    projectRepository,
    recommendationRepository,
    collaboratorRepository,
    userRepository,
    invitationRepository,
    requiredProfileRepository,
    mailSender,
    'https://conectau.test',
    appLogger,
  );
  const list = new ListInvitationsUseCase(
    projectRepository,
    invitationRepository,
  );
  const dto = {
    collaboratorIds: ['c1', 'c2'],
    message: 'Hola, nos gustaría contar contigo en el proyecto.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    projectRepository.findById.mockResolvedValue(
      buildProject({ leaderId: 'leader-1', title: 'Huerta IoT' }),
    );
    recommendationRepository.findByProject.mockResolvedValue([
      view('c1'),
      view('c2'),
      view('c3'),
    ]);
    requiredProfileRepository.findById.mockResolvedValue(
      buildRequiredProfile({ id: 'rp1', name: 'Desarrollador backend' }),
    );
    collaboratorRepository.findById.mockImplementation((id) =>
      Promise.resolve(
        buildCollaborator({
          id,
          email: `${id}@ufps.edu.co`,
          firstName: id.toUpperCase(),
          lastName: 'Prueba',
          dataConsent: true,
        }),
      ),
    );
    userRepository.findById.mockResolvedValue(
      buildUser({
        id: 'leader-1',
        fullName: 'Laura Líder',
        email: 'laura@ufps.edu.co',
      }),
    );
    invitationRepository.findRecentRecipientIds.mockResolvedValue([]);
    invitationRepository.createMany.mockImplementation((rows) =>
      Promise.resolve(
        rows.map((row, index) => ({
          ...row,
          id: `inv-${index}`,
          sentAt: new Date(),
        })),
      ),
    );
    mailSender.send.mockResolvedValue(undefined);
  });

  it('sends one email per person with the leader as Reply-To and records it', async () => {
    const result = await send.execute('leader-1', 'project-1', dto);

    expect(mailSender.send).toHaveBeenCalledTimes(2);
    expect(mailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'c1@ufps.edu.co',
        replyTo: 'laura@ufps.edu.co',
        subject: expect.stringContaining('Huerta IoT'),
        text: expect.stringContaining('Desarrollador backend'),
      }),
    );
    const [rows] = invitationRepository.createMany.mock.calls[0];
    expect(rows).toEqual([
      expect.objectContaining({
        collaboratorId: 'c1',
        status: 'ENVIADA',
        profileName: 'Desarrollador backend',
        sentById: 'leader-1',
      }),
      expect.objectContaining({ collaboratorId: 'c2', status: 'ENVIADA' }),
    ]);
    expect(result.sent).toBe(2);
    expect(result.invitations[0].recipientEmail).toBe('c1***@ufps.edu.co');
  });

  it('records a failed delivery without stopping the rest and never logs the address', async () => {
    mailSender.send.mockRejectedValueOnce(new Error('550 mailbox unavailable'));

    const result = await send.execute('leader-1', 'project-1', dto);

    expect(result).toMatchObject({ sent: 1, failed: 1 });
    const [rows] = invitationRepository.createMany.mock.calls[0];
    expect(rows[0]).toMatchObject({
      status: 'FALLIDA',
      errorMessage: 'El servidor de correo no aceptó el mensaje',
    });
    expect(JSON.stringify(contextLogger.error.mock.calls)).not.toContain('@');
  });

  it('skips people already invited in the last 24 h, without consent or inactive', async () => {
    invitationRepository.findRecentRecipientIds.mockResolvedValue(['c1']);
    collaboratorRepository.findById.mockImplementation((id) =>
      Promise.resolve(
        id === 'c2'
          ? buildCollaborator({ id, dataConsent: false })
          : id === 'c3'
            ? buildCollaborator({ id, dataConsent: true, active: false })
            : buildCollaborator({ id, dataConsent: true }),
      ),
    );

    const result = await send.execute('leader-1', 'project-1', {
      ...dto,
      collaboratorIds: ['c1', 'c2', 'c3'],
    });

    expect(mailSender.send).not.toHaveBeenCalled();
    expect(result.skipped.map((item) => item.reason)).toEqual([
      'YA_CONVOCADA',
      'SIN_AUTORIZACION',
      'INACTIVA',
    ]);
  });

  it('rejects people that were not recommended for the project', async () => {
    await expect(
      send.execute('leader-1', 'project-1', {
        ...dto,
        collaboratorIds: ['c1', 'stranger'],
      }),
    ).rejects.toThrow(
      new UnprocessableEntityException({ message: NOT_RECOMMENDED }),
    );
    expect(mailSender.send).not.toHaveBeenCalled();
  });

  it('returns 404 for a profile without recommendations and 403 for another leader', async () => {
    recommendationRepository.findByProject.mockResolvedValueOnce([]);
    await expect(
      send.execute('leader-1', 'project-1', {
        ...dto,
        requiredProfileId: 'rp-x',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      send.execute('intruder', 'project-1', dto),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists the history: masked email for the leader, full for the admin', async () => {
    invitationRepository.findByProject.mockResolvedValue([
      {
        id: 'i1',
        projectId: 'project-1',
        collaboratorId: 'c1',
        requiredProfileId: 'rp1',
        sentById: 'leader-1',
        recipientName: 'Ana Pérez',
        recipientEmail: 'ana@ufps.edu.co',
        profileName: 'Backend',
        status: 'ENVIADA',
        errorMessage: null,
        sentAt: new Date(),
      },
    ]);

    const leaderView = await list.execute(
      { userId: 'leader-1', role: 'LIDER' },
      'project-1',
    );
    const adminView = await list.execute(
      { userId: 'admin', role: 'ADMIN' },
      'project-1',
    );

    expect(leaderView.invitations[0].recipientEmail).toBe('an***@ufps.edu.co');
    expect(adminView.invitations[0].recipientEmail).toBe('ana@ufps.edu.co');
  });
});
