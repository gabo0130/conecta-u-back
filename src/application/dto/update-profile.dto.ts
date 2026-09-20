import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  studyGroup?: string;
}
