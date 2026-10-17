import { QuotaCircuitBreaker } from './quota-circuit-breaker';

describe('QuotaCircuitBreaker', () => {
  let now = 0;
  const breaker = () => new QuotaCircuitBreaker(1000, () => now);

  beforeEach(() => {
    now = 0;
  });

  it('starts closed for every model', () => {
    expect(breaker().isOpen('gemini-3.8-flash')).toBe(false);
  });

  it('opens only the tripped model until the cooldown ends', () => {
    const circuit = breaker();
    circuit.trip('gemini-3.8-flash');

    now = 999;
    expect(circuit.isOpen('gemini-3.8-flash')).toBe(true);
    expect(circuit.isOpen('gemini-3.5-flash-lite')).toBe(false);

    now = 1000;
    expect(circuit.isOpen('gemini-3.8-flash')).toBe(false);
  });

  it('restarts the cooldown when tripped again', () => {
    const circuit = breaker();
    circuit.trip('gemini-3.8-flash');
    now = 1500;
    circuit.trip('gemini-3.8-flash');

    now = 2400;
    expect(circuit.isOpen('gemini-3.8-flash')).toBe(true);
  });
});
