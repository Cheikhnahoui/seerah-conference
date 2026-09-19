import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyPassword, createDistributorToken } from '@/lib/distributorAuth';

/**
 * POST /api/distributor/login
 * عام — تسجيل دخول الموزّع برقم الهاتف وكلمة المرور.
 * لا علاقة له بـ admin_token إطلاقاً.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, password } = body;

    if (!phone_number || !password) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();
    const { data: distributor, error } = await supabase
      .from('distributors')
      .select('*')
      .eq('phone_number', phone_number.trim())
      .maybeSingle();

    if (error) {
      console.error('Supabase error (distributor login):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
    }

    if (!distributor) {
      return NextResponse.json({ success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (!distributor.is_active) {
      return NextResponse.json({ success: false, error: 'تم تعطيل هذا الحساب. تواصل مع الإدارة.' }, { status: 403 });
    }

    const valid = verifyPassword(password, distributor.password_hash, distributor.password_salt);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const token = createDistributorToken(distributor.id, distributor.phone_number);

    return NextResponse.json({
      success: true,
      data: {
        token,
        distributor: { id: distributor.id, full_name: distributor.full_name, phone_number: distributor.phone_number },
      },
    });
  } catch (error) {
    console.error('Distributor login error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}