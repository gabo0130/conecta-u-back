import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { BcryptPasswordHasherService } from '../infrastructure/security/bcrypt-password-hasher.service';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service';
import { PASSWORD_HASHER, TOKEN_SERVICE } from '../shared/interfaces/tokens';
import { AuthorizationGuard } from './guards/authorization.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PersistenceModule } from './persistence.module';

/** JWT, hash de contraseñas y guards de autenticación/autorización, configurados en un solo lugar. */
@Module({
  imports: [
    PersistenceModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Sin valor por defecto: arrancar firmando con un secreto conocido sería un hueco de seguridad (RT8).
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
            '7d',
          ) as StringValue,
        },
      }),
    }),
  ],
  providers: [
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    JwtAuthGuard,
    AuthorizationGuard,
  ],
  exports: [PASSWORD_HASHER, TOKEN_SERVICE, JwtAuthGuard, AuthorizationGuard],
})
export class SecurityModule {}
