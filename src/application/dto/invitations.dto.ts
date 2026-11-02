import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { INVITATION_LIMITS } from '../../domain/entities/invitation';
import { IsRequiredText } from './validators/text.decorators';

/** RF21: convocar por correo a personas recomendadas para el proyecto. */
export class SendInvitationsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Selecciona al menos una persona' })
  @ArrayMaxSize(INVITATION_LIMITS.maxRecipients, {
    message: `Puedes convocar hasta ${INVITATION_LIMITS.maxRecipients} personas por envío`,
  })
  @ArrayUnique()
  @IsUUID('all', { each: true })
  collaboratorIds: string[];

  /** Perfil para el que se convoca (aparece en el correo). */
  @IsOptional()
  @IsUUID()
  requiredProfileId?: string;

  @IsRequiredText({
    min: INVITATION_LIMITS.messageMin,
    max: INVITATION_LIMITS.messageMax,
  })
  message: string;
}
