import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from './presentation/ai.module';
import { AuthModule } from './presentation/auth.module';
import { HealthController } from './presentation/controllers/health.controller';
import { MatchmakingModule } from './presentation/matchmaking.module';
import { ProfilesModule } from './presentation/profiles.module';
import { ProjectsModule } from './presentation/projects.module';
import { UsersModule } from './presentation/users.module';
import { LoggingModule } from './shared/logging/logging.module';
import { TraceIdMiddleware } from './shared/logging/trace-id.middleware';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const synchronize =
          configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true';
        const sslEnabled =
          configService.get<string>('DB_SSL', 'true') === 'true';

        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize,
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          migrations: ['dist/migrations/*.js'],
        };
      },
    }),
    LoggingModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ProjectsModule,
    AiModule,
    MatchmakingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
