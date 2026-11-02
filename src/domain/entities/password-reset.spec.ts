import { issuedBeforePasswordChange } from './password-reset';

describe('issuedBeforePasswordChange', () => {
  const changedAt = new Date('2026-11-02T15:00:00.700Z');
  const seconds = Math.floor(changedAt.getTime() / 1000);

  it('keeps tokens valid when the password never changed', () => {
    expect(issuedBeforePasswordChange(null, 1)).toBe(false);
  });

  it('revokes tokens issued before the change, also those without iat', () => {
    expect(issuedBeforePasswordChange(changedAt, seconds - 1)).toBe(true);
    expect(issuedBeforePasswordChange(changedAt, undefined)).toBe(true);
  });

  it('accepts tokens issued in the same second or later (new login)', () => {
    expect(issuedBeforePasswordChange(changedAt, seconds)).toBe(false);
    expect(issuedBeforePasswordChange(changedAt, seconds + 60)).toBe(false);
  });
});
