import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

type TokenUser = {
  id: string;
  email: string;
  role: string;
  org_id: string | null;
};

@Injectable()
export class TokenService {
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiration: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtRefreshSecret = configService.get<string>(
      'JWT_REFRESH_SECRET',
      'change-me-refresh',
    );
    this.jwtRefreshExpiration = configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
  }

  generateTokens(user: TokenUser, mfaVerified: boolean) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      mfa_verified: mfaVerified,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtRefreshSecret,
      expiresIn: this.jwtRefreshExpiration as unknown as number,
    });

    return { accessToken, refreshToken };
  }

  generateMfaPendingToken(user: TokenUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      mfa_verified: false,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '5m' as unknown as number,
    });
  }

  verifyRefreshToken(token: string): { sub: string; mfa_verified?: boolean } {
    return this.jwtService.verify(token, {
      secret: this.jwtRefreshSecret,
    });
  }
}
