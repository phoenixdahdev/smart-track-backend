import { createCipheriv, randomBytes } from 'crypto';

export const AES_GCM_ALGORITHM = 'aes-256-gcm';
export const AES_GCM_IV_LENGTH = 12;
export const AES_GCM_AUTH_TAG_LENGTH = 16;

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a colon-separated string: `<ivHex>:<authTagHex>:<ciphertextHex>`.
 */
export function aes256GcmEncrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(AES_GCM_IV_LENGTH);
  const cipher = createCipheriv(AES_GCM_ALGORITHM, key, iv, {
    authTagLength: AES_GCM_AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}
