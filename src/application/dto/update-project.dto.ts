import { IsArray, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @Length(3, 160)
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  knownSkills?: string[];

  @IsOptional()
  @IsString()
  semillero?: string;

  @IsOptional()
  @IsString()
  program?: string;
}
