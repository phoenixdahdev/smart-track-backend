import { Controller, Get } from '@nestjs/common';
import { AppService } from '@services/app.service';
import { Public } from '@decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  getHealth() {
    return this.appService.getHealth();
  }
}
