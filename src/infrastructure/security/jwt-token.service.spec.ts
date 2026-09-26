import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';
import { createMock } from '../../testing/test-doubles.testing';

describe('JwtTokenService', () => {
  const jwtService = createMock<JwtService>();

  const service = new JwtTokenService(jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates token using jwt service', () => {
    jwtService.sign.mockReturnValue('token-value');

    expect(service.generate('9')).toBe('token-value');
    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: '9',
      kind: 'access',
    });
  });

  it('verifies token and returns payload', () => {
    jwtService.verify.mockReturnValue({ userId: 9, kind: 'access' });

    expect(service.verify('token-value')).toEqual({
      userId: 9,
      kind: 'access',
    });
  });

  it('reads the access token lifetime from the token itself', () => {
    jwtService.decode.mockReturnValue({ iat: 1000, exp: 87400 });

    expect(service.expiresInSeconds('token-value')).toBe(86400);
  });

  it('throws UnauthorizedException when verify fails', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    expect(() => service.verify('bad-token')).toThrow(UnauthorizedException);
  });

  it('generates refresh token with 30d expiry', () => {
    jwtService.sign.mockReturnValue('refresh-token-value');

    expect(service.generateRefresh('9', 'LIDER')).toBe('refresh-token-value');
    expect(jwtService.sign).toHaveBeenCalledWith(
      { userId: '9', role: 'LIDER', kind: 'refresh' },
      { expiresIn: '30d' },
    );
  });

  it('verifies refresh token and returns payload', () => {
    jwtService.verify.mockReturnValue({ userId: 9, kind: 'refresh' });

    expect(service.verifyRefresh('refresh-token-value')).toEqual({
      userId: 9,
      kind: 'refresh',
    });
  });

  it('throws UnauthorizedException when refresh token kind does not match', () => {
    jwtService.verify.mockReturnValue({ userId: 9, kind: 'access' });

    expect(() => service.verifyRefresh('access-token-value')).toThrow(
      UnauthorizedException,
    );
  });
});
