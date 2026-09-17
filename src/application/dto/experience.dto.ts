import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class ExperienceDto {
  @IsString()
  @Length(1, 140)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  period?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
