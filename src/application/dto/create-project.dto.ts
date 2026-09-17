import { IsArray, IsOptional, IsString, Length } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(3, 160)
  title: string;

  @IsString()
  summary: string;

  @IsString()
  objectives: string;

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
