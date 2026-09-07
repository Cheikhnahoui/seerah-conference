import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';
import { UpdateType } from '@/types';

/**
 * GET /api/updates
 * عام (بلا مصادقة) — تُستخدَم في الصفحة الرئيسية وصفحة "كل المستجدات".
 * تُرجع فقط المنشورات المنشورة (is_published = true) للزوار.
 * إذا أُرسل admin_token صالح، تُرجع كل المنشورات (منشورة وغير منشورة) لصفحة الإدارة.
 *
 * Query params مدعومة:
 *   - type: فلترة بنوع واحد (news/announcement/notice/scholar/event)
 *   - limit: عدد النتائج (افتراضي 20)
 *   - offset: للـ pagination (افتراضي 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as UpdateType | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const isAdmin = !!token && verifyAdminToken(token);

    const supabase = createServerSupabase();
    let query = supabase
      .from('updates')
      .select('*', { count: 'exact' })
      .order('is_pinned', { ascending: false })
      .order('publish_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!isAdmin) {
      query = query.eq('is_published', true);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error (GET /api/updates):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المستجدات' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      meta: { total: count ?? 0, limit, offset },
    });
  } catch (error) {
    console.error('Get updates error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * POST /api/updates
 * محمي — إنشاء منشور جديد من لوحة الإدارة.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      content,
      image_url,
      additional_images,
      country,
      role,
      participation_status,
      is_published,
      is_pinned,
      is_important_notice,
      publish_date,
    } = body;

    const validTypes = ['news', 'announcement', 'notice', 'scholar', 'event'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: 'نوع منشور غير صالح' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'العنوان مطلوب' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: post, error } = await supabase
      .from('updates')
      .insert({
        type,
        title: title.trim(),
        content: content?.trim() || null,
        image_url: image_url?.trim() || null,
        additional_images: Array.isArray(additional_images) && additional_images.length > 0
          ? additional_images
          : null,
        country: type === 'scholar' ? (country?.trim() || null) : null,
        role: type === 'scholar' ? (role?.trim() || null) : null,
        participation_status: type === 'scholar' ? (participation_status || null) : null,
        is_published: is_published ?? true,
        is_pinned: is_pinned ?? false,
        is_important_notice: is_important_notice ?? false,
        publish_date: publish_date || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error (POST /api/updates):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error('Create update error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}