import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  const jwtService: jest.Mocked<Pick<JwtService, 'sign' | 'verify'>> = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const service = new JwtTokenService(jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates token using jwt service', () => {
    jwtService.sign.mockReturnValue('token-value');

    expect(service.generate(9)).toBe('token-value');
    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: 9,
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

  it('throws UnauthorizedException when verify fails', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    expect(() => service.verify('bad-token')).toThrow(UnauthorizedException);
  });

  it('generates refresh token with 30d expiry', () => {
    jwtService.sign.mockReturnValue('refresh-token-value');

    expect(service.generateRefresh(9, 'USER')).toBe('refresh-token-value');
    expect(jwtService.sign).toHaveBeenCalledWith(
      { userId: 9, role: 'USER', kind: 'refresh' },
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
