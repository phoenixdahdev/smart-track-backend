import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      message: 'SmartTrack Health API is running',
    };
  }
}
