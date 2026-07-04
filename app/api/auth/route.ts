import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken } from '@/lib/utils';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Brute force protection: max 3 attempts per IP+email per 10 minutes
const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(3, '10m'),
  prefix: 'ratelimit:auth',
});

export async function POST(request: NextRequest) {
  try {
    // Get IP address
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Read body first to get email
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // Rate limit key = IP + email → each user blocked independently
    const rateLimitKey = `${ip}:${email}`;
    const { success, remaining, reset } = await authRatelimit.limit(rateLimitKey);

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `تم تجاوز الحد المسموح به. يرجى الانتظار ${Math.ceil(retryAfterSeconds / 60)} دقيقة قبل المحاولة مجدداً.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: `بيانات الدخول غير صحيحة. المحاولات المتبقية: ${remaining}`,
        },
        { status: 401 }
      );
    }

    const token = createAdminToken(email);

    return NextResponse.json({
      success: true,
      token,
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}

// Verify token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, valid: false }, { status: 401 });
    }

    const { verifyAdminToken } = await import('@/lib/utils');
    const valid = verifyAdminToken(token);

    return NextResponse.json({ success: true, valid });
  } catch {
    return NextResponse.json({ success: false, valid: false }, { status: 500 });
  }
}