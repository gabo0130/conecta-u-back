import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { isOpenNeed, type NeedEntity } from '../../domain/entities/need';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import type { Actor } from './project-access';

async function findNeedOrFail(
  needRepository: NeedRepository,
  needId: string,
): Promise<NeedEntity> {
  const need = await needRepository.findById(needId);
  if (!need) throw new NotFoundException({ message: NOT_FOUND });
  return need;
}

/** La ve su formulador y el ADMIN; cualquier otro recibe 403 (RNF4). */
export async function loadNeedForViewer(
  needRepository: NeedRepository,
  actor: Actor,
  needId: string,
): Promise<NeedEntity> {
  const need = await findNeedOrFail(needRepository, needId);
  if (actor.role !== 'ADMIN' && need.createdById !== actor.userId) {
    throw new ForbiddenException({ message: 'Prohibido' });
  }
  return need;
}

/** Para modificarla: solo su formulador y mientras siga abierta (409 si ya se cerró). */
export async function loadOpenOwnedNeed(
  needRepository: NeedRepository,
  userId: string,
  needId: string,
): Promise<NeedEntity> {
  const need = await findNeedOrFail(needRepository, needId);
  if (need.createdById !== userId) {
    throw new ForbiddenException({ message: 'Prohibido' });
  }
  if (!isOpenNeed(need.status)) {
    throw new ConflictException({ message: NEED_CLOSED_MESSAGE });
  }
  return need;
}

export const NOT_FOUND = 'Recurso no encontrado';

/** Resultado de `updateIfOpen`: null significa que se cerró mientras tanto (409). */
export function requireStillOpen(need: NeedEntity | null): NeedEntity {
  if (!need) throw new ConflictException({ message: NEED_CLOSED_MESSAGE });
  return need;
}

export const NEED_CLOSED_MESSAGE =
  'La necesidad ya se convirtió en oportunidad o se descartó: no se puede modificar.';
