import { BadRequestException } from '@nestjs/common';
import {
  type ExperiencePeriod,
  experiencePeriodError,
} from '../../domain/entities/experience-period';

export function assertValidExperiencePeriod(period: ExperiencePeriod): void {
  const error = experiencePeriodError(period);
  if (error) {
    throw new BadRequestException({ message: error });
  }
}
