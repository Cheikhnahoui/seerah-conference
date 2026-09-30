import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

/**
 * GET /api/org-content
 * عام — يُرجع سجل org_content الوحيد (من نحن/الرسالة/الرؤية/الشعار...).
 */
export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('org_content')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase error (GET org-content):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || {} });
  } catch (error) {
    console.error('Get org-content error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * PUT /api/org-content
 * محمي — تعديل السجل الوحيد لمحتوى التجمّع.
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();

    const allowedFields = [
      'hero_description', 'hero_description_fr',
      'about_text', 'about_text_fr',
      'mission_text', 'mission_text_fr',
      'vision_text', 'vision_text_fr',
      'fields_text', 'fields_text_fr',
      'history_text', 'history_text_fr',
      'about_image_url',
      'logo_url', 'org_name', 'org_name_fr',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    const supabase = createServerSupabase();

    // نجلب السجل الوحيد أولاً؛ إن لم يوجد (حالة غير متوقَّعة) ننشئه
    const { data: existing } = await supabase.from('org_content').select('id').limit(1).maybeSingle();

    let result;
    if (existing) {
      result = await supabase.from('org_content').update(updates).eq('id', existing.id).select().single();
    } else {
      result = await supabase.from('org_content').insert(updates).select().single();
    }

    if (result.error) {
      console.error('Supabase error (PUT org-content):', result.error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Update org-content error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}