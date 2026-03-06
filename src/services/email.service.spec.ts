import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email-id' }),
    },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal: string) => {
        const config: Record<string, string> = {
          RESEND_API_KEY: 'test-key',
          FROM_EMAIL: 'test@smarttrack.health',
          FRONTEND_URL: 'http://localhost:3001',
        };
        return config[key] ?? defaultVal;
      }),
    } as unknown as ConfigService;

    service = new EmailService(configService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send OTP email without throwing', async () => {
    await expect(
      service.sendOtp('user@test.com', 'Test User', '123456'),
    ).resolves.not.toThrow();
  });

  it('should send password reset email without throwing', async () => {
    await expect(
      service.sendPasswordReset('user@test.com', 'Test User', 'reset-token'),
    ).resolves.not.toThrow();
  });

  it('should not throw when resend fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require('resend') as { Resend: jest.Mock };
    Resend.mockImplementation(() => ({
      emails: {
        send: jest.fn().mockRejectedValue(new Error('API error')),
      },
    }));

    const configService = {
      get: jest.fn().mockReturnValue(''),
    } as unknown as ConfigService;
    const svc = new EmailService(configService);

    await expect(
      svc.sendOtp('user@test.com', 'Test', '123456'),
    ).resolves.not.toThrow();
  });
});
