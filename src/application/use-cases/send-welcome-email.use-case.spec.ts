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

  it('swallows and logs a delivery failure instead of throwing', async () => {
    mailSender.send.mockRejectedValue(new Error('SMTP caído'));

    await expect(useCase.execute(recipient)).resolves.toBeUndefined();

    expect(contextLogger.error).toHaveBeenCalled();
  });
});
