/**
 * Cada cuánto se vuelve a probar un modelo con la cuota diaria agotada. La cuota se reinicia
 * una vez al día; mientras tanto, una sola llamada de prueba cada media hora.
 */
export const DAILY_QUOTA_COOLDOWN_MS = 30 * 60 * 1000;

/**
 * Cortacircuitos en memoria por modelo (RT7): tras un 429 por cuota diaria, el modelo no se
 * vuelve a llamar hasta que pase el enfriamiento, y el análisis responde 503 sin gastar cuota.
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

  trip(model: string): void {
    this.openUntil.set(model, this.now() + this.cooldownMs);
  }
}
