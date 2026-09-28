import {
  IsBoolean,
  IsIn,
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
import { PERSON_TYPES } from '../../domain/entities/person-type.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsProfileUrl } from './validators/is-profile-url.decorator';
import { IsRequiredText, IsOptionalText } from './validators/text.decorators';

export class CreateMyCollaboratorDto {
  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  firstName: string;

  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  lastName: string;

  @IsIn(PERSON_TYPES)
  personType: PersonType;

  @IsUUID()
  programId: string;

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
