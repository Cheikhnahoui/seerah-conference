import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

/**
 * GET /api/updates/[id]
 * عام — تُستخدَم في صفحة تفاصيل المنشور /updates/[id].
 * الزوار العاديون لا يرون منشوراً غير منشور (is_published = false).
 * مسؤول الإدارة (admin_token صالح) يرى أي منشور، منشوراً كان أو لا،
 * ليتمكن من معاينته قبل النشر من لوحة التحكم.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const isAdmin = !!token && verifyAdminToken(token);

    const supabase = createServerSupabase();
    const { data: post, error } = await supabase
      .from('updates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase error (GET /api/updates/[id]):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
    }

    if (!post || (!post.is_published && !isAdmin)) {
      return NextResponse.json({ success: false, error: 'المنشور غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Get update error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * PUT /api/updates/[id]
 * محمي — تعديل حقول المنشور (بما فيها is_published و is_pinned و
 * is_important_notice، فتغطي أيضاً أزرار "نشر/إلغاء نشر" و"تثبيت"
 * في لوحة الإدارة دون الحاجة لنقطة API منفصلة لكل زر).
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

    const allowedFields = [
      'type', 'title', 'content', 'image_url', 'additional_images',
      'country', 'role', 'participation_status',
      'is_published', 'is_pinned', 'is_important_notice', 'publish_date',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if ('title' in updates && (typeof updates.title !== 'string' || (updates.title as string).trim().length < 2)) {
      return NextResponse.json({ success: false, error: 'العنوان مطلوب' }, { status: 400 });
    }
    if ('type' in updates) {
      const validTypes = ['news', 'announcement', 'notice', 'scholar', 'event'];
      if (!validTypes.includes(updates.type as string)) {
        return NextResponse.json({ success: false, error: 'نوع منشور غير صالح' }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: post, error } = await supabase
      .from('updates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error (PUT /api/updates/[id]):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * DELETE /api/updates/[id]
 * محمي — حذف نهائي لمنشور واحد.
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
    const { error } = await supabase.from('updates').delete().eq('id', id);

    if (error) {
      console.error('Supabase error (DELETE /api/updates/[id]):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحذف' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}