/**
 * Autorización de tratamiento de datos (Ley 1581 de 2012): si se autoriza, se guarda
 * cuándo, como evidencia; si se revoca, la fecha se borra.
 */
export function consentFields(consent: boolean, now = new Date()) {
  return { dataConsent: consent, dataConsentAt: consent ? now : null };
}
