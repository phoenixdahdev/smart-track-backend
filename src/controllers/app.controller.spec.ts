import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from '@services/app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return health status with ok', () => {
      const result = controller.getHealth();
      expect(result.message).toBe('SmartTrack Health API is running');
      expect(result.data.status).toBe('ok');
    });

    it('should include a timestamp', () => {
      const result = controller.getHealth();
      expect(result.data.timestamp).toBeDefined();
      expect(typeof result.data.timestamp).toBe('string');
    });
  });
});
