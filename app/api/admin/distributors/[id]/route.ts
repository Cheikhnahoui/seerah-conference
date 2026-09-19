import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';
import { hashPassword } from '@/lib/distributorAuth';

/**
 * PUT /api/admin/distributors/[id]
 * محمي بـ admin_token — تفعيل/تعطيل، أو تعديل الاسم/الهاتف/كلمة المرور.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { full_name, phone_number, password, is_active } = body;

    const updates: Record<string, unknown> = {};

    if (typeof full_name === 'string') {
      if (full_name.trim().length < 3) {
        return NextResponse.json({ success: false, error: 'اسم غير صالح' }, { status: 400 });
      }
      updates.full_name = full_name.trim();
    }

    if (typeof phone_number === 'string') {
      if (phone_number.trim().length < 6) {
        return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
      }
      updates.phone_number = phone_number.trim();
    }

    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
      }
      const { hash, salt } = hashPassword(password);
      updates.password_hash = hash;
      updates.password_salt = salt;
    }

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: distributor, error } = await supabase
      .from('distributors')
      .update(updates)
      .eq('id', id)
      .select('id, full_name, phone_number, is_active, created_at')
      .single();

    if (error) {
      console.error('Supabase error (PUT distributor):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: distributor });
  } catch (error) {
    console.error('Update distributor error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/distributors/[id]
 * محمي بـ admin_token — حذف نهائي للموزّع فقط. المشاركون الذين سجّلهم
 * لا يُحذفون (distributor_id تصبح NULL بفضل ON DELETE SET NULL).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerSupabase();
    const { error } = await supabase.from('distributors').delete().eq('id', id);

    if (error) {
      console.error('Supabase error (DELETE distributor):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الموزّع بنجاح' });
  } catch (error) {
    console.error('Delete distributor error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}