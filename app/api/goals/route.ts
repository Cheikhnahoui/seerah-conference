import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

/**
 * GET /api/goals
 * عام — يُرجع الأهداف الفعّالة مرتَّبة حسب display_order.
 * إن كان الطالب إدارة (admin_token صالح)، يُرجع كل الأهداف (بما فيها غير الفعّالة).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const isAdmin = !!token && verifyAdminToken(token);

    const supabase = createServerSupabase();
    let query = supabase.from('goals').select('*').order('display_order', { ascending: true });
    if (!isAdmin) query = query.eq('is_active', true);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error (GET goals):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * POST /api/goals
 * محمي — إنشاء هدف جديد.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { title, title_fr, description, description_fr, icon, display_order, is_active } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'العنوان مطلوب' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('goals')
      .insert({
        title: title.trim(),
        title_fr: title_fr?.trim() || null,
        description: description?.trim() || null,
        description_fr: description_fr?.trim() || null,
        icon: icon?.trim() || null,
        display_order: display_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error (POST goals):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}