import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PASSWORD_LIMITS } from '../../domain/entities/password-reset';
import type { PasswordResetToken } from '../../domain/entities/password-reset';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  APP_URL,
  COLLABORATOR_REPOSITORY,
  PASSWORD_HASHER,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { renderPasswordChangedEmail } from '../mail/password-reset-email.template';
import { AccountMailer } from '../support/account-mailer';
import { hashResetToken } from '../support/password-reset-token';

export const RESET_LINK_INVALID =
  'El enlace para restablecer la contraseña venció o ya se usó. Solicita uno nuevo.';
export const SAME_PASSWORD_USED =
  'La contraseña nueva debe ser distinta de la actual. Por seguridad este enlace ya no sirve: solicita uno nuevo.';

/**
 * Crea la contraseña nueva con un enlace de recuperación válido. El enlace se consume una sola
 * vez, se invalidan los demás pendientes, se cierran las sesiones abiertas (`passwordChangedAt`)
 * y se avisa del cambio al correo principal y al alterno.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly tokenRepository: PasswordResetTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly accountMailer: AccountMailer,
    @Inject(APP_URL) private readonly appUrl: string,
  ) {}

  /** Para que la página avise antes de pedir la contraseña si el enlace ya no sirve. */
  async check(token: string, now = new Date()): Promise<{ valid: boolean }> {
    return { valid: (await this.usableToken(token, now)) !== null };
  }

  async execute(
    token: string,
    password: string,
    now = new Date(),
  ): Promise<{ message: string }> {
    if (Buffer.byteLength(password, 'utf8') > PASSWORD_LIMITS.maxBytes) {
      throw new UnprocessableEntityException({
        message: `La contraseña es demasiado larga (máximo ${PASSWORD_LIMITS.maxBytes} bytes; las tildes y la ñ ocupan dos)`,
      });
    }
    const resetToken = await this.usableToken(token, now);
    const user = resetToken
      ? await this.userRepository.findById(resetToken.userId)
      : null;
    if (!resetToken || !user || !user.active) {
      throw new UnprocessableEntityException({ message: RESET_LINK_INVALID });
    }
    // Primero se gasta el enlace: así no sirve para probar contraseñas contra la actual.
    if (!(await this.tokenRepository.consume(resetToken.id, now))) {
      throw new UnprocessableEntityException({ message: RESET_LINK_INVALID });
    }
    const current = await this.userRepository.findByEmailWithPassword(
      user.email,
    );
    if (
      current &&
      (await this.passwordHasher.compare(password, current.passwordHash))
    ) {
      throw new UnprocessableEntityException({ message: SAME_PASSWORD_USED });
    }

    await this.userRepository.updatePassword(
      user.id,
      await this.passwordHasher.hash(password),
      now,
    );
    await this.tokenRepository.invalidateForUser(user.id, now);

    const collaborator = await this.collaboratorRepository.findByUserId(
      user.id,
    );
    await this.accountMailer.send(
      { email: user.email, alternateEmail: collaborator?.alternateEmail },
      (toAlternate) =>
        renderPasswordChangedEmail({
          fullName: user.fullName,
          changedAt: now,
          appUrl: this.appUrl,
          toAlternate,
        }),
      { purpose: 'contrasena-cambiada' },
    );
    return {
      message: 'Tu contraseña se actualizó. Ya puedes iniciar sesión con ella.',
    };
  }

  private usableToken(
    token: string,
    now: Date,
  ): Promise<PasswordResetToken | null> {
    return this.tokenRepository.findUsable(hashResetToken(token), now);
  }
}
