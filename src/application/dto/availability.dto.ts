import { IsIn, IsInt, Max, Min } from 'class-validator';
import { AVAILABILITY_STATUSES } from '../../domain/entities/availability-status.type';
import type { AvailabilityStatus } from '../../domain/entities/availability-status.type';

export class AvailabilityDto {
  @IsIn(AVAILABILITY_STATUSES)
  availabilityStatus: AvailabilityStatus;

  @IsInt()
  @Min(0)
  @Max(60)
  weeklyHours: number;
}
