import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  PERSON_NAME_MAX_LENGTH,
  RESEARCH_GROUP_MAX_LENGTH,
  SEMESTER,
} from '../../domain/entities/collaborator-limits';
import { UpdateIdentificationDto } from './person-identification.dto';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsProfileUrl } from './validators/is-profile-url.decorator';
import { IsRequiredText, IsOptionalText } from './validators/text.decorators';

/**
 * El propio perfil: datos del perfil técnico, contacto y documento. El documento solo se puede
 * registrar si aún no lo tiene (personas anteriores a v2.1); cambiarlo es del ADMIN.
 */
export class UpdateCollaboratorDto extends UpdateIdentificationDto {
  @IsOptionalNonNull()
  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  firstName?: string;

  @IsOptionalNonNull()
  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  lastName?: string;

  @IsOptionalNonNull()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsInt()
  @Min(SEMESTER.min)
  @Max(SEMESTER.max)
  semester?: number | null;

  @IsOptionalText(RESEARCH_GROUP_MAX_LENGTH)
  researchGroup?: string | null;

  @IsOptionalText()
  summary?: string | null;

  @IsOptional()
  @IsProfileUrl()
  profileUrl?: string | null;

  @IsOptionalNonNull()
  @IsBoolean()
  dataConsent?: boolean;
}
