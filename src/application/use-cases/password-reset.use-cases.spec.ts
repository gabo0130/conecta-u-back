import { UnprocessableEntityException } from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type {
  MailMessage,
  MailSender,
} from '../../domain/repositories/mail-sender.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import {
  buildCollaborator,
  buildUser,
  createMock,
} from '../../testing/test-doubles.testing';
import { AccountMailer } from '../support/account-mailer';
import { hashResetToken } from '../support/password-reset-token';
import {
  FORGOT_PASSWORD_MESSAGE,
  RequestPasswordResetUseCase,
} from './request-password-reset.use-case';
import {
  RESET_LINK_INVALID,
  ResetPasswordUseCase,
  SAME_PASSWORD_USED,
} from './reset-password.use-case';

const APP = 'https://conectau.test';
const now = new Date('2026-11-02T15:00:00Z');
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('password recovery', () => {
  const users = createMock<UserRepository>();
  const collaborators = createMock<CollaboratorRepository>();
  const tokens = createMock<PasswordResetTokenRepository>();
  const hasher = createMock<PasswordHasher>();
  const mailSender = createMock<MailSender>();
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const appLogger = {
    forContext: () => logger,
  } as unknown as AppLoggerService;
  const mailer = new AccountMailer(mailSender, appLogger);
  const request = new RequestPasswordResetUseCase(
    users,
    collaborators,
    tokens,
    mailer,
    APP,
    appLogger,
  );
  const reset = new ResetPasswordUseCase(
    users,
    collaborators,
    tokens,
    hasher,
    mailer,
    APP,
  );
  const sentTo = () =>
    mailSender.send.mock.calls.map(([mail]: [MailMessage]) => mail.to);

  beforeEach(() => {
    jest.clearAllMocks();
    users.findByEmail.mockResolvedValue(buildUser());
    users.findById.mockResolvedValue(buildUser());
    users.findByEmailWithPassword.mockResolvedValue(buildUser());
    collaborators.findByUserId.mockResolvedValue(
      buildCollaborator({ alternateEmail: 'ana.personal@gmail.com' }),
    );
    tokens.countCreatedSince.mockResolvedValue(0);
    tokens.consume.mockResolvedValue(true);
    mailSender.send.mockResolvedValue(undefined);
    hasher.compare.mockResolvedValue(false);
    hasher.hash.mockResolvedValue('new-hash');
  });

  describe('request', () => {
    it('stores only the hash and mails a one-time link to the main and alternate emails', async () => {
      await expect(request.execute(' ANA@example.com ', now)).resolves.toEqual({
        message: FORGOT_PASSWORD_MESSAGE,
      });
      await flush();

      expect(users.findByEmail).toHaveBeenCalledWith('ana@example.com');
      expect(tokens.invalidateForUser).toHaveBeenCalledWith('user-1', now);
      const saved = tokens.create.mock.calls[0][0];
      expect(saved.expiresAt).toEqual(new Date('2026-11-02T15:30:00Z'));
      expect(sentTo()).toEqual(['ana@example.com', 'ana.personal@gmail.com']);

      const link = /#token=([A-Za-z0-9_-]{43})/.exec(
        mailSender.send.mock.calls[0][0].text,
      );
      expect(link).not.toBeNull();
      // En la base queda el hash, nunca el token del enlace.
      expect(saved.tokenHash).toBe(hashResetToken(link![1]));
      expect(saved.tokenHash).not.toContain(link![1]);
      expect(mailSender.send.mock.calls[0][0].text).toContain(
        `${APP}/restablecer-contrasena#token=`,
      );
    });

    it('answers the same and sends nothing for unknown or disabled accounts', async () => {
      users.findByEmail.mockResolvedValueOnce(null);
      await expect(request.execute('nadie@x.co', now)).resolves.toEqual({
        message: FORGOT_PASSWORD_MESSAGE,
      });
      users.findByEmail.mockResolvedValueOnce(buildUser({ active: false }));
      await request.execute('ana@example.com', now);
      await flush();
      expect(tokens.create).not.toHaveBeenCalled();
      expect(mailSender.send).not.toHaveBeenCalled();
    });

    it('stops creating links after the hourly limit without telling the caller', async () => {
      tokens.countCreatedSince.mockResolvedValue(3);
      await expect(request.execute('ana@example.com', now)).resolves.toEqual({
        message: FORGOT_PASSWORD_MESSAGE,
      });
      await flush();
      expect(tokens.create).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    const token = 'a'.repeat(43);
    const usable = {
      id: 't-1',
      userId: 'user-1',
      expiresAt: new Date('2026-11-02T15:20:00Z'),
      usedAt: null,
    };

    it('reports whether a link can still be used', async () => {
      tokens.findUsable.mockResolvedValueOnce(usable);
      await expect(reset.check(token, now)).resolves.toEqual({ valid: true });
      tokens.findUsable.mockResolvedValueOnce(null);
      await expect(reset.check(token, now)).resolves.toEqual({ valid: false });
      expect(tokens.findUsable).toHaveBeenCalledWith(
        hashResetToken(token),
        now,
      );
    });

    it('sets the new password, closes sessions, burns the links and notifies both emails', async () => {
      tokens.findUsable.mockResolvedValue(usable);
      await reset.execute(token, 'Nueva2026', now);

      expect(tokens.consume).toHaveBeenCalledWith('t-1', now);
      expect(users.updatePassword).toHaveBeenCalledWith(
        'user-1',
        'new-hash',
        now,
      );
      expect(tokens.invalidateForUser).toHaveBeenCalledWith('user-1', now);
      expect(sentTo()).toEqual(['ana@example.com', 'ana.personal@gmail.com']);
      expect(mailSender.send.mock.calls[0][0].subject).toBe(
        'Tu contraseña de Conecta U cambió',
      );
    });

    it('rejects an expired, used or raced link', async () => {
      tokens.findUsable.mockResolvedValueOnce(null);
      await expect(reset.execute(token, 'Nueva2026', now)).rejects.toThrow(
        RESET_LINK_INVALID,
      );
      tokens.findUsable.mockResolvedValueOnce(usable);
      tokens.consume.mockResolvedValueOnce(false);
      await expect(reset.execute(token, 'Nueva2026', now)).rejects.toThrow(
        RESET_LINK_INVALID,
      );
      expect(users.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects a disabled account, the same password and passwords over 72 bytes', async () => {
      tokens.findUsable.mockResolvedValue(usable);
      users.findById.mockResolvedValueOnce(buildUser({ active: false }));
      await expect(reset.execute(token, 'Nueva2026', now)).rejects.toThrow(
        RESET_LINK_INVALID,
      );
      hasher.compare.mockResolvedValueOnce(true);
      await expect(reset.execute(token, 'Actual2026', now)).rejects.toThrow(
        SAME_PASSWORD_USED,
      );
      await expect(
        reset.execute(token, `ñ1${'ñ'.repeat(40)}`, now),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(users.updatePassword).not.toHaveBeenCalled();
    });
  });
});
