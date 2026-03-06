import { type ModuleMetadata } from '@nestjs/common';
import { AppController } from './app.controller';

export const controllers: ModuleMetadata['controllers'] = [AppController];
