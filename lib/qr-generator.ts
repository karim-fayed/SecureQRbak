import QRCode from 'qrcode';
import crypto from 'crypto';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface QRCodeData {
  id: string;
  data: any;
  timestamp: number;
  version: string;
}

export async function generateQRCode(
  data: any,
  options: QRCodeOptions = {}
): Promise<{ qrCodeDataURL: string; encryptedData: string; signature: string }> {
  try {
    // Create structured data with metadata
    const qrData: QRCodeData = {
      id: crypto.randomUUID(),
      data,
      timestamp: Date.now(),
      version: '1.0',
    };

    // Convert to JSON string
    const jsonData = JSON.stringify(qrData);

    // Encrypt the data
    const { encryptedData, signature } = encryptData(jsonData);

    // Generate QR code from encrypted data
    const defaultOptions: QRCodeOptions = {
      width: 256,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
      ...options,
    };

    const qrCodeDataURL = await QRCode.toDataURL(encryptedData, {
      width: defaultOptions.width,
      margin: defaultOptions.margin,
      color: defaultOptions.color,
      errorCorrectionLevel: defaultOptions.errorCorrectionLevel,
    });

    return {
      qrCodeDataURL,
      encryptedData,
      signature,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function encryptData(data: string): { encryptedData: string; signature: string } {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine IV, encrypted data, and auth tag
  const encryptedData = iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');

  // Create signature
  const signature = crypto.createHmac('sha256', key).update(encryptedData).digest('hex');

  return { encryptedData, signature };
}

export function decryptData(encryptedData: string, signature: string): any {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', key).update(encryptedData).digest('hex');
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse JSON data
    const qrData: QRCodeData = JSON.parse(decrypted);

    return qrData;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt QR code data');
  }
}

export function validateQRCodeData(data: any): boolean {
  // Basic validation
  if (!data || typeof data !== 'object') return false;
  if (!data.id || !data.data || !data.timestamp || !data.version) return false;

  // Check if timestamp is reasonable (not in future, not too old)
  const now = Date.now();
  const dataTime = data.timestamp;
  const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);

  if (dataTime > now || dataTime < oneYearAgo) return false;

  return true;
}
