import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
}

export function encrypt(text: string, key?: string): EncryptedData {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = crypto.scryptSync(key || process.env.ENCRYPTION_KEY || 'default-encryption-key', salt, KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  cipher.setAAD(Buffer.from('secure-qr-aad'));

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decrypt(encryptedData: EncryptedData, key?: string): string {
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const derivedKey = crypto.scryptSync(key || process.env.ENCRYPTION_KEY || 'default-encryption-key', salt, KEY_LENGTH);
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAAD(Buffer.from('secure-qr-aad'));
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [saltHex, hashHex] = hashedPassword.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');

  const testHash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, testHash);
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function createSignature(data: string, key?: string): string {
  const hmacKey = key || process.env.HMAC_KEY || 'default-hmac-key';
  return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
}

export function verifySignature(data: string, signature: string, key?: string): boolean {
  const expectedSignature = createSignature(data, key);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export function createEncryptedQRData(data: any): { encryptedData: string; signature: string } {
  const jsonData = JSON.stringify(data);
  const encrypted = encrypt(jsonData);
  const signature = createSignature(encrypted.encrypted);

  return {
    encryptedData: `${encrypted.iv}:${encrypted.encrypted}:${encrypted.salt}:${encrypted.tag}`,
    signature,
  };
}

export function verifyAndDecryptQRData(encryptedData: string, signature: string): any {
  const expectedSignature = createSignature(encryptedData);
  if (!verifySignature(encryptedData, signature)) {
    throw new Error('Invalid signature');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [iv, encrypted, salt, tag] = parts;
  const decrypted = decrypt({ encrypted, iv, salt, tag });
  return JSON.parse(decrypted);
}

export function verifyAndDecryptQRDataWithoutSignature(encryptedData: string): any {
  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [iv, encrypted, salt, tag] = parts;
  const decrypted = decrypt({ encrypted, iv, salt, tag });
  return JSON.parse(decrypted);
}

export function generateUUID(): string {
  return crypto.randomUUID();
}
