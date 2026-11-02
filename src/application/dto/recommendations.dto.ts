import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  FEEDBACK_DECISIONS,
  FEEDBACK_REASON_MAX_LENGTH,
  type FeedbackDecision,
} from '../../domain/entities/recommendation-feedback';
import { IsOptionalText } from './validators/text.decorators';

/** Los parámetros de la URL llegan como texto: "true"/"false" se convierten a booleano. */
const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export class GenerateRecommendationsDto {
  /** Incluye en el cálculo a quienes figuran NO_DISPONIBLE (por defecto no). */
  @IsOptional()
  @IsBoolean()
  includeUnavailable?: boolean;
}

export class ListRecommendationsQueryDto {
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeUnavailable?: boolean;
}

/** Tesis (D6): el líder acepta o descarta a una persona recomendada. */
export class RecommendationFeedbackDto {
  @IsIn(FEEDBACK_DECISIONS, {
    message: `decision debe ser uno de: ${FEEDBACK_DECISIONS.join(', ')}`,
  })
  decision: FeedbackDecision;

  @IsOptionalText(FEEDBACK_REASON_MAX_LENGTH)
  reason?: string | null;
}
