import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

/**
 * GET /api/org-stats
 * عام — يُرجع الإحصائيات الفعّالة مرتَّبة حسب display_order.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const isAdmin = !!token && verifyAdminToken(token);

    const supabase = createServerSupabase();
    let query = supabase.from('org_stats').select('*').order('display_order', { ascending: true });
    if (!isAdmin) query = query.eq('is_active', true);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error (GET org-stats):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get org-stats error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * POST /api/org-stats
 * محمي — إنشاء إحصائية جديدة.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { label, label_fr, value, icon, display_order, is_active } = body;

    if (!label || label.trim().length < 1) {
      return NextResponse.json({ success: false, error: 'العنوان مطلوب' }, { status: 400 });
    }
    if (!value || String(value).trim().length < 1) {
      return NextResponse.json({ success: false, error: 'القيمة مطلوبة' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('org_stats')
      .insert({
        label: label.trim(),
        label_fr: label_fr?.trim() || null,
        value: String(value).trim(),
        icon: icon?.trim() || null,
        display_order: display_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error (POST org-stats):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Create stat error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}