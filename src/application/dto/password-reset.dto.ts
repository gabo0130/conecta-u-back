import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_LIMITS } from '../../domain/entities/password-reset';

// 32 bytes en base64url: 43 caracteres de [A-Za-z0-9_-].
const RESET_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const TOKEN_MESSAGE = 'El enlace de recuperación no es válido';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Formato de email inválido' })
  @MaxLength(255)
  email: string;
}

export class ResetTokenDto {
  @IsString({ message: TOKEN_MESSAGE })
  @Matches(RESET_TOKEN, { message: TOKEN_MESSAGE })
  token: string;
}

export class ResetPasswordDto extends ResetTokenDto {
  @IsString()
  @MinLength(PASSWORD_LIMITS.minLength, {
    message: `La contraseña debe tener al menos ${PASSWORD_LIMITS.minLength} caracteres`,
  })
  // El límite real es de bytes (bcrypt); se revisa también en el caso de uso.
  @MaxLength(PASSWORD_LIMITS.maxBytes, {
    message: `La contraseña es demasiado larga (máximo ${PASSWORD_LIMITS.maxBytes} bytes; las tildes y la ñ ocupan dos)`,
  })
  @Matches(/(?=.*\p{L})(?=.*\d)/u, {
    message: 'La contraseña debe combinar letras y números',
  })
  password: string;
}
