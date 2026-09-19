import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyDistributorToken } from '@/lib/distributorAuth';

/**
 * GET /api/distributor/my-attendees
 * محمي بتوكن الموزّع — يُرجع فقط من سجّلهم هذا الموزّع تحديداً.
 * لا وصول لأي بيانات مشاركين آخرين مهما كان مصدرهم.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = verifyDistributorToken(token || null);

    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    const { data: distributor } = await supabase
      .from('distributors')
      .select('id, is_active')
      .eq('id', session.distributorId)
      .maybeSingle();

    if (!distributor || !distributor.is_active) {
      return NextResponse.json({ success: false, error: 'الحساب غير فعّال. تواصل مع الإدارة.' }, { status: 403 });
    }

    const { data: attendees, error, count } = await supabase
      .from('attendees')
      .select('id, full_name, phone_number, city, registration_date, registration_number', { count: 'exact' })
      .eq('distributor_id', session.distributorId)
      .order('registration_date', { ascending: false });

    if (error) {
      console.error('Supabase error (distributor my-attendees):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الجلب' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: attendees,
      meta: { total: count ?? attendees?.length ?? 0 },
    });
  } catch (error) {
    console.error('Distributor my-attendees error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}