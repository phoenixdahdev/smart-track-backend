import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv } from 'crypto';
import {
  AES_GCM_ALGORITHM,
  AES_GCM_AUTH_TAG_LENGTH,
  aes256GcmEncrypt,
} from '@utils/aes-gcm.util';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private key: Buffer;
  private keyValid = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const hexKey = this.configService.get<string>('ENCRYPTION_KEY', '');
    if (!hexKey || hexKey.length !== 64) {
      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';
      if (isProduction) {
        throw new Error(
          'ENCRYPTION_KEY must be 64 hex characters (32 bytes). Cannot start in production without valid encryption key.',
        );
      }
      this.logger.warn(
        'ENCRYPTION_KEY must be 64 hex characters (32 bytes). Encryption will fail at runtime.',
      );
      this.key = Buffer.alloc(32);
      this.keyValid = false;
    } else {
      this.key = Buffer.from(hexKey, 'hex');
      this.keyValid = true;
    }
  }

  encrypt(plaintext: string): string {
    if (!this.keyValid) {
      throw new Error('Encryption key not configured');
    }
    return aes256GcmEncrypt(plaintext, this.key);
  }

  decrypt(ciphertext: string): string {
    if (!this.keyValid) {
      throw new Error('Encryption key not configured');
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(AES_GCM_ALGORITHM, this.key, iv, {
      authTagLength: AES_GCM_AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}
