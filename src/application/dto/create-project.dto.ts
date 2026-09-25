import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class DeliverableDto {
  @IsString()
  @MaxLength(140)
  name: string;

  @IsString()
  scope: string;
}

export class CreateProjectDto {
  @IsString()
  @Length(3, 160)
  title: string;

  @IsString()
  summary: string;

  @IsString()
  objectives: string;

  @IsUUID()
  typeId: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsObject()
  typeData?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  knownSkillIds?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables: DeliverableDto[];
}
