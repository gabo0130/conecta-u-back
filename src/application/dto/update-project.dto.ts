import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { DeliverableDto } from './create-project.dto';

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
  @IsUUID()
  typeId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

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

  // RF10: un proyecto conserva al menos un entregable.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables?: DeliverableDto[];
}
