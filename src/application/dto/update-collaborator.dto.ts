import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PERSON_NAME_MAX_LENGTH,
  RESEARCH_GROUP_MAX_LENGTH,
  SEMESTER,
} from '../../domain/entities/collaborator-limits';

export class UpdateCollaboratorDto {
  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  lastName?: string;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsInt()
  @Min(SEMESTER.min)
  @Max(SEMESTER.max)
  semester?: number;

  @IsOptional()
  @IsString()
  @MaxLength(RESEARCH_GROUP_MAX_LENGTH)
  researchGroup?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @IsBoolean()
  dataConsent?: boolean;
}
