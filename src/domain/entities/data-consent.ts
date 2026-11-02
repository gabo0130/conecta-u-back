/**
 * Autorización de tratamiento de datos (Ley 1581 de 2012): si se autoriza, se guarda
 * cuándo, como evidencia; si se revoca, la fecha se borra.
 */
export function consentFields(consent: boolean, now = new Date()) {
  return { dataConsent: consent, dataConsentAt: consent ? now : null };
}

/**
 * Declaración de veracidad (v2.2, E2; principio de buena fe, art. 83 de la Constitución):
 * igual que la autorización, se guarda cuándo se declaró y se borra si se retira.
 */
export function truthfulnessFields(declared: boolean, now = new Date()) {
  return {
    truthfulnessDeclared: declared,
    truthfulnessDeclaredAt: declared ? now : null,
  };
}
