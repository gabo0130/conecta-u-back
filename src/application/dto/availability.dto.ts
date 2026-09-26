import { IsIn, IsInt, Max, Min } from 'class-validator';
import { AVAILABILITY_STATUSES } from '../../domain/entities/availability-status.type';
import type { AvailabilityStatus } from '../../domain/entities/availability-status.type';
import { COLLABORATOR_WEEKLY_HOURS } from '../../domain/entities/collaborator-limits';

export class AvailabilityDto {
  @IsIn(AVAILABILITY_STATUSES)
  availabilityStatus: AvailabilityStatus;

  @IsInt()
  @Min(COLLABORATOR_WEEKLY_HOURS.min)
  @Max(COLLABORATOR_WEEKLY_HOURS.max)
  weeklyHours: number;
}
