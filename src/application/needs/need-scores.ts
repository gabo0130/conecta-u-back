import type { NeedEntity } from '../../domain/entities/need';
import { computeNeedCompleteness } from '../../domain/services/need-completeness';
import { computeNeedPriority } from '../../domain/services/need-priority';

export type ScoredFields = Pick<
  NeedEntity,
  'urgency' | 'impact' | 'deadline' | 'dependency' | 'characterization'
>;

/**
 * Puntajes que se guardan en la necesidad para ordenar la lista: se recalculan cada vez que
 * cambia algo que los afecta (registro, edición, caracterización).
 */
export function scoreNeed(
  need: ScoredFields,
): Pick<NeedEntity, 'completeness' | 'priorityScore'> {
  const completeness = computeNeedCompleteness(need).score;
  const { score } = computeNeedPriority({ ...need, completeness });
  return { completeness, priorityScore: score };
}
