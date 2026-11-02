import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_RESET_RULES } from '../../domain/entities/password-reset';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  APP_URL,
  COLLABORATOR_REPOSITORY,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { joinUrl } from '../mail/email-layout';
import { renderPasswordResetEmail } from '../mail/password-reset-email.template';
import { AccountMailer } from '../support/account-mailer';
import { newResetToken } from '../support/password-reset-token';

/** Misma respuesta exista o no la cuenta: no revela qué correos están registrados. */
export const FORGOT_PASSWORD_MESSAGE =
  'Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva. Revisa también tu correo alterno y la carpeta de spam.';

const RESET_PATH = '/restablecer-contrasena';
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/**
 * Solicitud de recuperación de contraseña. Genera un token de un solo uso (en la base solo su
 * hash), invalida los anteriores y envía el enlace al correo principal y al alterno.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepository: PasswordResetTokenRepository,
    private readonly accountMailer: AccountMailer,
    @Inject(APP_URL) private readonly appUrl: string,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(RequestPasswordResetUseCase.name);
  }

  async execute(email: string, now = new Date()): Promise<{ message: string }> {
    const answer = { message: FORGOT_PASSWORD_MESSAGE };
    const user = await this.userRepository.findByEmail(
      email.trim().toLowerCase(),
    );
    if (!user || !user.active) return answer;

    const recent = await this.tokenRepository.countCreatedSince(
      user.id,
      new Date(now.getTime() - HOUR_MS),
    );
    if (recent >= PASSWORD_RESET_RULES.maxRequestsPerHour) {
      this.logger.warn('Límite de solicitudes de recuperación alcanzado', {
        method: 'execute',
        userId: user.id,
      });
      return answer;
    }

    const { token, tokenHash } = newResetToken();
    await this.tokenRepository.invalidateForUser(user.id, now);
    await this.tokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(
        now.getTime() + PASSWORD_RESET_RULES.ttlMinutes * MINUTE_MS,
      ),
    });
    const collaborator = await this.collaboratorRepository.findByUserId(
      user.id,
    );
    // El token va en el fragmento (#): el navegador no lo envía a ningún servidor ni en el Referer.
    const resetUrl = `${joinUrl(this.appUrl, RESET_PATH)}#token=${token}`;

    // Sin esperar el envío: la respuesta tarda lo mismo exista o no la cuenta.
    void this.accountMailer.send(
      { email: user.email, alternateEmail: collaborator?.alternateEmail },
      (toAlternate) =>
        renderPasswordResetEmail({
          fullName: user.fullName,
          resetUrl,
          ttlMinutes: PASSWORD_RESET_RULES.ttlMinutes,
          toAlternate,
        }),
      { purpose: 'recuperacion-contrasena' },
    );
    return answer;
  }
}
