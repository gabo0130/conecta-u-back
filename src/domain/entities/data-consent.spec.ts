import { consentFields, truthfulnessFields } from './data-consent';

describe('data-consent', () => {
  const now = new Date('2026-11-02T10:00:00Z');

  it('stores the consent date when granted and clears it when revoked', () => {
    expect(consentFields(true, now)).toEqual({
      dataConsent: true,
      dataConsentAt: now,
    });
    expect(consentFields(false, now)).toEqual({
      dataConsent: false,
      dataConsentAt: null,
    });
  });

  it('does the same with the truthfulness declaration (v2.2, E2)', () => {
    expect(truthfulnessFields(true, now)).toEqual({
      truthfulnessDeclared: true,
      truthfulnessDeclaredAt: now,
    });
    expect(truthfulnessFields(false, now)).toEqual({
      truthfulnessDeclared: false,
      truthfulnessDeclaredAt: null,
    });
  });
});
