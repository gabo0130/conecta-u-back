import type { Transporter } from 'nodemailer';
import { LogOnlyMailSender } from './log-only-mail-sender';
import { SmtpMailSender } from './smtp-mail-sender';

describe('SmtpMailSender', () => {
  const sendMail = jest.fn();
  const transporter = { sendMail } as unknown as Transporter;
  const sender = new SmtpMailSender(
    {
      host: 'smtp.test',
      port: 587,
      secure: false,
      from: 'Conecta U <no-reply@conectau.test>',
    },
    transporter,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delivers the message with the configured sender', async () => {
    sendMail.mockResolvedValue({});

    await sender.send({
      to: 'ana@example.com',
      subject: 'Hola',
      html: '<p>Hola</p>',
      text: 'Hola',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'Conecta U <no-reply@conectau.test>',
      to: 'ana@example.com',
      subject: 'Hola',
      html: '<p>Hola</p>',
      text: 'Hola',
    });
  });

  it('propagates a delivery failure to the caller', async () => {
    sendMail.mockRejectedValue(new Error('rechazado'));

    await expect(
      sender.send({ to: 'x@y.co', subject: 's', html: 'h', text: 't' }),
    ).rejects.toThrow('rechazado');
  });
});

describe('LogOnlyMailSender', () => {
  it('only logs and never fails', async () => {
    const warn = jest.fn();
    const sender = new LogOnlyMailSender({
      warn,
    } as unknown as ConstructorParameters<typeof LogOnlyMailSender>[0]);

    await expect(
      sender.send({ to: 'x@y.co', subject: 's', html: 'h', text: 't' }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
  });
});
