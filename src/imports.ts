import { ConfigModule } from '@nestjs/config';
import { type ModuleMetadata } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';

export const imports: ModuleMetadata['imports'] = [
  ConfigModule.forRoot({ isGlobal: true }),
  DatabaseModule,
];
