import type { NeedEntity } from '../../domain/entities/need';
import { computeNeedCompleteness } from '../../domain/services/need-completeness';

export type ScoredFields = Pick<
  NeedEntity,
  'deadline' | 'dependency' | 'characterization'
>;

/**
 * Puntajes que se guardan en la necesidad para ordenar la lista: se recalculan cada vez que
 * cambia algo que los afecta (registro, edición, caracterización).
 */
export function scoreNeed(
  need: ScoredFields,
): Pick<NeedEntity, 'completeness'> {
  return { completeness: computeNeedCompleteness(need).score };
}
