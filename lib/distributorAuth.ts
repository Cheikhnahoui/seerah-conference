import * as crypto from 'crypto';

/**
 * تشفير/تحقق كلمات مرور الموزعين باستخدام scrypt (مدمج في Node،
 * لا يتطلب أي حزمة npm جديدة). كل موزّع له salt عشوائي خاص به.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const candidate = crypto.scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');
    if (candidate.length !== stored.length) return false;
    return crypto.timingSafeEqual(candidate, stored);
  } catch {
    return false;
  }
}

/**
 * توقيع HMAC-SHA256 مستقل تماماً عن توكن الإدارة (admin_token) —
 * يستخدم نفس متغيرات البيئة الموجودة أصلاً (ADMIN_EMAIL/ADMIN_PASSWORD)
 * كمصدر للسر، لكن بلاحقة مختلفة، فلا يمكن لأي توكن أن يُستخدَم مكان الآخر.
 */
function getDistributorSecret(): string {
  return `${process.env.ADMIN_EMAIL}:${process.env.ADMIN_PASSWORD}:seerah-conf-distributor-secret`;
}

function hmacSign(payload: string): string {
  return crypto.createHmac('sha256', getDistributorSecret()).update(payload).digest('hex');
}

export function createDistributorToken(distributorId: string, phoneNumber: string): string {
  const payload = `${distributorId}:${phoneNumber}:${Date.now()}`;
  const signature = hmacSign(payload);
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * يتحقق من توكن الموزّع ويُرجع هويته إن كان صالحاً، أو null إن لم يكن.
 * لا يتحقق من is_active في قاعدة البيانات — هذا مسؤولية نقطة الـ API
 * التي تستدعي هذه الدالة (لضمان تعطيل فوري لأي موزّع تُعطّله الإدارة
 * حتى لو كان توكنه لا يزال صالحاً زمنياً).
 */
export function verifyDistributorToken(
  token: string | null
): { distributorId: string; phoneNumber: string } | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 4) return null;

    const signature = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join(':');
    const [distributorId, phoneNumber, timestamp] = parts;

    const expectedSig = hmacSign(payload);
    if (signature !== expectedSig) return null;

    const age = Date.now() - parseInt(timestamp);
    if (age > 24 * 60 * 60 * 1000 || age < 0) return null;

    return { distributorId, phoneNumber };
  } catch {
    return null;
  }
}