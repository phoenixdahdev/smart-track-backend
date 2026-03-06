import { imports } from './imports';
import { Module } from '@nestjs/common';
import { services } from './services/base.service';
import { controllers } from './controllers/base.controller';

@Module({
  imports: [...(imports ?? [])],
  controllers: [...(controllers ?? [])],
  providers: [...services],
})
export class AppModule {}
