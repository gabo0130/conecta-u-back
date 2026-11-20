/**
 * Cada cuánto se vuelve a probar un modelo con la cuota diaria agotada. La cuota se reinicia
 * una vez al día; mientras tanto, una sola llamada de prueba cada media hora.
 */
export const DAILY_QUOTA_COOLDOWN_MS = 30 * 60 * 1000;

/**
 * Cortacircuitos en memoria por modelo (RT7): tras agotar su cuota (o su límite de uso), el
 * modelo no se vuelve a llamar hasta que pase el enfriamiento, y el análisis responde 503 sin
 * gastar cuota.
 * Vive en el proceso: al reiniciar el servidor se pierde y la primera llamada vuelve a probar.
 */
export class QuotaCircuitBreaker {
  private readonly openUntil = new Map<string, number>();

  constructor(
    private readonly cooldownMs = DAILY_QUOTA_COOLDOWN_MS,
    private readonly now: () => number = Date.now,
  ) {}

  isOpen(model: string): boolean {
    const until = this.openUntil.get(model);
    if (until === undefined) return false;
    if (this.now() < until) return true;
    this.openUntil.delete(model);
    return false;
  }

  /** `cooldownMs` reemplaza al enfriamiento por defecto (p. ej. el `retry-after` del proveedor). */
  trip(model: string, cooldownMs = this.cooldownMs): void {
    this.openUntil.set(model, this.now() + cooldownMs);
  }
}
