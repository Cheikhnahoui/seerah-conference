import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';
import { hashPassword } from '@/lib/distributorAuth';

/**
 * GET /api/admin/distributors
 * محمي بـ admin_token — قائمة كل الموزعين مع عدد المسجَّلين لكل واحد.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    const { data: distributors, error } = await supabase
      .from('distributors')
      .select('id, full_name, phone_number, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error (GET distributors):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
    }

    // عدد المسجَّلين لكل موزّع (استعلام واحد يُجمَّع محلياً بدل N استعلام)
    const { data: counts } = await supabase
      .from('attendees')
      .select('distributor_id')
      .not('distributor_id', 'is', null);

    const countMap: Record<string, number> = {};
    (counts || []).forEach((row: { distributor_id: string | null }) => {
      if (row.distributor_id) {
        countMap[row.distributor_id] = (countMap[row.distributor_id] || 0) + 1;
      }
    });

    const withCounts = (distributors || []).map((d) => ({
      ...d,
      registered_count: countMap[d.id] || 0,
    }));

    return NextResponse.json({ success: true, data: withCounts });
  } catch (error) {
    console.error('Get distributors error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * POST /api/admin/distributors
 * محمي بـ admin_token — إنشاء موزّع جديد (اسم، هاتف، كلمة مرور).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone_number, password } = body;

    if (!full_name || full_name.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'اسم غير صالح' }, { status: 400 });
    }
    if (!phone_number || phone_number.trim().length < 6) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from('distributors')
      .select('id')
      .eq('phone_number', phone_number.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: 'رقم الهاتف مستخدَم من موزّع آخر' }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);

    const { data: distributor, error } = await supabase
      .from('distributors')
      .insert({
        full_name: full_name.trim(),
        phone_number: phone_number.trim(),
        password_hash: hash,
        password_salt: salt,
        is_active: true,
      })
      .select('id, full_name, phone_number, is_active, created_at')
      .single();

    if (error) {
      console.error('Supabase error (POST distributors):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: distributor }, { status: 201 });
  } catch (error) {
    console.error('Create distributor error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}