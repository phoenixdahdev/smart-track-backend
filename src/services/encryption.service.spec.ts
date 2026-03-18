import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const validKey = 'a'.repeat(64);

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue(validKey),
    } as unknown as ConfigService;
    service = new EncryptionService(configService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt a string', () => {
    const plaintext = 'SSN: 123-45-6789';
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it('should produce different ciphertexts for the same input (random IV)', () => {
    const plaintext = 'same-input';
    const a = service.encrypt(plaintext);
    const b = service.encrypt(plaintext);

    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe(plaintext);
    expect(service.decrypt(b)).toBe(plaintext);
  });

  it('should produce ciphertext in iv:authTag:encrypted format', () => {
    const encrypted = service.encrypt('test');
    const parts = encrypted.split(':');

    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(parts[1]).toHaveLength(32); // 16 bytes = 32 hex chars
  });

  it('should throw on invalid ciphertext format', () => {
    expect(() => service.decrypt('invalid')).toThrow(
      'Invalid ciphertext format',
    );
    expect(() => service.decrypt('aa:bb')).toThrow('Invalid ciphertext format');
  });

  it('should throw on tampered ciphertext', () => {
    const encrypted = service.encrypt('sensitive data');
    const parts = encrypted.split(':');
    parts[2] = 'ff' + parts[2].slice(2); // tamper with ciphertext
    const tampered = parts.join(':');

    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('should handle empty string', () => {
    const encrypted = service.encrypt('');
    expect(service.decrypt(encrypted)).toBe('');
  });

  it('should handle unicode text', () => {
    const plaintext = 'Patient: Juan Carlos \u00d1u\u00f1ez \ud83c\udfe5';
    const encrypted = service.encrypt(plaintext);
    expect(service.decrypt(encrypted)).toBe(plaintext);
  });

  describe('with invalid key', () => {
    it('should warn and set keyValid=false when ENCRYPTION_KEY is missing in dev', () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ENCRYPTION_KEY') return '';
          if (key === 'NODE_ENV') return 'development';
          return '';
        }),
      } as unknown as ConfigService;
      const svc = new EncryptionService(configService);
      const warnSpy = jest.spyOn(svc['logger'], 'warn').mockImplementation();

      svc.onModuleInit();

      expect(warnSpy).toHaveBeenCalled();
    });

    it('should throw on encrypt when key is invalid', () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ENCRYPTION_KEY') return '';
          if (key === 'NODE_ENV') return 'development';
          return '';
        }),
      } as unknown as ConfigService;
      const svc = new EncryptionService(configService);
      jest.spyOn(svc['logger'], 'warn').mockImplementation();
      svc.onModuleInit();

      expect(() => svc.encrypt('test')).toThrow('Encryption key not configured');
    });

    it('should throw on decrypt when key is invalid', () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ENCRYPTION_KEY') return '';
          if (key === 'NODE_ENV') return 'development';
          return '';
        }),
      } as unknown as ConfigService;
      const svc = new EncryptionService(configService);
      jest.spyOn(svc['logger'], 'warn').mockImplementation();
      svc.onModuleInit();

      expect(() => svc.decrypt('aa:bb:cc')).toThrow('Encryption key not configured');
    });

    it('should throw on init in production mode with invalid key', () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ENCRYPTION_KEY') return '';
          if (key === 'NODE_ENV') return 'production';
          return '';
        }),
      } as unknown as ConfigService;
      const svc = new EncryptionService(configService);

      expect(() => svc.onModuleInit()).toThrow('Cannot start in production');
    });
  });
});
