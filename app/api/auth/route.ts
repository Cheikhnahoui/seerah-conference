import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ success: false, error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
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
