import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AVAILABILITY_STATUSES } from '../../domain/entities/availability-status.type';
import type { AvailabilityStatus } from '../../domain/entities/availability-status.type';

export class AvailabilityDto {
  @IsOptional()
  @IsIn(AVAILABILITY_STATUSES)
  availabilityStatus?: AvailabilityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  weeklyHours?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  modality?: string;
}
