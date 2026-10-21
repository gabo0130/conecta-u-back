import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

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
