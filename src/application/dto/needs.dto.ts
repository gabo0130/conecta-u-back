import { applyDecorators } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  NEED_KINDS,
  NEED_LIMITS,
  NEED_STATUSES,
  type NeedKind,
  type NeedStatus,
} from '../../domain/entities/need';
import {
  NEED_SORTS,
  type NeedSort,
} from '../../domain/repositories/need.repository.interface';
import { PaginationQueryDto } from './pagination-query.dto';
import { IsCalendarDate } from './validators/is-calendar-date.decorator';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsOptionalText, IsRequiredText } from './validators/text.decorators';

const { scale } = NEED_LIMITS;
const scaleMessage = (field: string) =>
  `${field} debe ser un número entero entre ${scale.min} y ${scale.max}`;
/** Urgencia e impacto: entero de la escala 1–5 que declara el formulador. */
function IsNeedScale(field: string) {
  const message = scaleMessage(field);
  return applyDecorators(
    IsInt({ message }),
    Min(scale.min, { message }),
    Max(scale.max, { message }),
  );
}

const KIND_MESSAGE = `kind debe ser uno de: ${NEED_KINDS.join(', ')}`;

/** Tesis (D1): el formulador describe la necesidad con sus palabras. */
export class CreateNeedDto {
  @IsRequiredText(NEED_LIMITS.title)
  title: string;

  @IsRequiredText(NEED_LIMITS.description)
  description: string;

  @IsIn(NEED_KINDS, { message: KIND_MESSAGE })
  kind: NeedKind;

  @IsNeedScale('urgency')
  urgency: number;

  @IsNeedScale('impact')
  impact: number;

  @IsOptional()
  @IsCalendarDate()
  deadline?: string | null;

  @IsOptionalText(NEED_LIMITS.dependencyMax)
  dependency?: string | null;
}

/** Edición parcial mientras la necesidad sigue abierta (REGISTRADA o CARACTERIZADA). */
export class UpdateNeedDto {
  @IsOptionalNonNull()
  @IsRequiredText(NEED_LIMITS.title)
  title?: string;

  @IsOptionalNonNull()
  @IsRequiredText(NEED_LIMITS.description)
  description?: string;

  @IsOptionalNonNull()
  @IsIn(NEED_KINDS, { message: KIND_MESSAGE })
  kind?: NeedKind;

  @IsOptionalNonNull()
  @IsNeedScale('urgency')
  urgency?: number;

  @IsOptionalNonNull()
  @IsNeedScale('impact')
  impact?: number;

  @IsOptional()
  @IsCalendarDate()
  deadline?: string | null;

  @IsOptionalText(NEED_LIMITS.dependencyMax)
  dependency?: string | null;
}

export class DiscardNeedDto {
  @IsOptionalText(NEED_LIMITS.discardReasonMax)
  reason?: string | null;
}

export class ListNeedsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(NEED_STATUSES)
  status?: NeedStatus;

  @IsOptional()
  @IsIn(NEED_KINDS)
  kind?: NeedKind;

  @IsOptional()
  @IsIn(NEED_SORTS)
  sort: NeedSort = 'recent';
}
