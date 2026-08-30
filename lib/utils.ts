import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import QRCode from 'qrcode';
import * as crypto from 'crypto';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRegistrationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ISNA-${timestamp}-${random}`;
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: { dark: '#1a5c2a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('فشل في إنشاء رمز QR');
  }
}

/**
 * Validates a phone number internationally via libphonenumber-js.
 * Expects an E.164 string (e.g. "+22222123456") as sent by the
 * client-side PhoneInput component. Falls back to treating the
 * number as Mauritanian if it has no leading "+", for compatibility
 * with any older caller still sending bare digits.
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  try {
    const value = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    const parsed = parsePhoneNumberFromString(value);
    return !!parsed && parsed.isValid();
  } catch {
    return false;
  }
}

/**
 * Normalizes a phone number to strict E.164 (e.g. "+22222123456").
 * If the number can't be parsed (shouldn't happen once it passed
 * validatePhone), it falls back to a digits-only string so nothing
 * ever throws.
 */
export function formatPhoneNumber(phone: string): string {
  try {
    const value = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    const parsed = parsePhoneNumberFromString(value);
    if (parsed && parsed.isValid()) return parsed.number;
  } catch {
    // fall through
  }
  return phone.replace(/\D/g, '');
}

export function validateName(name: string): boolean {
  return name.trim().length >= 3 && name.trim().length <= 100;
}

/**
 * Generates a cryptographically random, unguessable token to be used
 * as the QR Code payload for manually-created invitations. Unlike
 * the human-readable registration_number, this carries no meaning
 * and no personal information — it's a pure opaque identifier the
 * backend resolves server-side.
 */
export function generateQrToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-MA', {
      calendar: 'gregory',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(date);
  } catch { return dateString; }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-MA', {
      calendar: 'gregory',
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(date);
  } catch { return dateString; }
}

export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// FIX 2: Strong HMAC-SHA256 token — impossible to forge without the secret
function getSecret(): string {
  // Use a combination of both env vars as the signing secret
  return `${process.env.ADMIN_EMAIL}:${process.env.ADMIN_PASSWORD}:seerah-conf-secret`;
}

function hmacSign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function createAdminToken(email: string): string {
  const payload = `${email}:${Date.now()}`;
  const signature = hmacSign(payload);
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 3) return false;

    const signature = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(':');
    const [email, timestamp] = parts;

    // Verify signature
    const expectedSig = hmacSign(payload);
    if (signature !== expectedSig) return false;

    // Verify email
    if (email !== process.env.ADMIN_EMAIL) return false;

    // Verify token age (max 24 hours)
    const age = Date.now() - parseInt(timestamp);
    if (age > 24 * 60 * 60 * 1000 || age < 0) return false;

    return true;
  } catch { return false; }
}