import { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';
import type { MailSender } from '../../domain/repositories/mail-sender.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import { createMock } from '../../testing/test-doubles.testing';

describe('SendWelcomeEmailUseCase', () => {
  const mailSender = createMock<MailSender>();
  const contextLogger = { info: jest.fn(), error: jest.fn() };
  const appLogger = {
    forContext: () => contextLogger,
  } as unknown as AppLoggerService;
  const useCase = new SendWelcomeEmailUseCase(
    mailSender,
    'https://conectau.test',
    appLogger,
  );

  const recipient = {
    fullName: 'Ana Pérez',
    email: 'ana@example.com',
    role: 'COLABORADOR' as const,
  };

  beforeEach(() => jest.clearAllMocks());

  it('sends the rendered welcome email to the new account', async () => {
    mailSender.send.mockResolvedValue(undefined);

    await useCase.execute(recipient);

    expect(mailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        subject: expect.stringContaining('Conecta U'),
        html: expect.stringContaining('Completar mi perfil'),
        text: expect.stringContaining('https://conectau.test/login'),
      }),
    );
  });

  describe('correo alterno (v2.2, E3)', () => {
    const withAlternate = {
      ...recipient,
      alternateEmail: 'ana.personal@gmail.com',
    };

    it('sends one email per recipient: main and alternate', async () => {
      mailSender.send.mockResolvedValue(undefined);

      await useCase.execute(withAlternate);

      expect(mailSender.send).toHaveBeenCalledTimes(2);
      expect(mailSender.send.mock.calls.map(([mail]) => mail.to)).toEqual([
        'ana@example.com',
        'ana.personal@gmail.com',
      ]);
    });

    it('still sends to one recipient when the other fails', async () => {
      mailSender.send.mockImplementation(({ to }) =>
        to === 'ana@example.com'
          ? Promise.reject(new Error('Buzón lleno'))
          : Promise.resolve(),
      );

      await expect(useCase.execute(withAlternate)).resolves.toBeUndefined();

      expect(mailSender.send).toHaveBeenCalledTimes(2);
      expect(contextLogger.error).toHaveBeenCalledTimes(1);
      expect(contextLogger.info).toHaveBeenCalledWith(
        'Correo de bienvenida enviado',
        expect.objectContaining({ kind: 'alterno' }),
      );
    });

    it('sends only once when there is no alternate email or it is the same address', async () => {
      mailSender.send.mockResolvedValue(undefined);

      await useCase.execute({ ...recipient, alternateEmail: null });
      await useCase.execute({
        ...recipient,
        alternateEmail: 'ANA@example.com',
      });

      expect(mailSender.send).toHaveBeenCalledTimes(2);
    });

    it('never logs the email addresses', async () => {
      mailSender.send.mockResolvedValue(undefined);

      await useCase.execute(withAlternate);

      expect(JSON.stringify(contextLogger.info.mock.calls)).not.toMatch(/@/);
    });
  });

  it('swallows and logs a delivery failure instead of throwing', async () => {
    mailSender.send.mockRejectedValue(new Error('SMTP caído'));

    await expect(useCase.execute(recipient)).resolves.toBeUndefined();

    expect(contextLogger.error).toHaveBeenCalled();
  });
});
