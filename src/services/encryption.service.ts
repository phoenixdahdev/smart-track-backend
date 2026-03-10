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

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const hexKey = this.configService.get<string>('ENCRYPTION_KEY', '');
    if (!hexKey || hexKey.length !== 64) {
      this.logger.warn(
        'ENCRYPTION_KEY must be 64 hex characters (32 bytes). Encryption will fail at runtime.',
      );
      this.key = Buffer.alloc(32);
    } else {
      this.key = Buffer.from(hexKey, 'hex');
    }
  }

  encrypt(plaintext: string): string {
    return aes256GcmEncrypt(plaintext, this.key);
  }

  decrypt(ciphertext: string): string {
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
