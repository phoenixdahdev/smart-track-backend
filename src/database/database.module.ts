import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'smarttrack'),
        autoLoadEntities: true,
        synchronize: false,
        extra: {
          max: config.get<number>('DB_POOL_MAX', 20),
          min: config.get<number>('DB_POOL_MIN', 5),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
        logging:
          config.get<string>('NODE_ENV') === 'production'
            ? ['error', 'warn']
            : ['error', 'warn', 'query'],
        maxQueryExecutionTime: config.get<number>('DB_SLOW_QUERY_MS', 1000),
      }),
    }),
  ],
})
export class DatabaseModule {}
