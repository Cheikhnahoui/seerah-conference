import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }
    const supabase = createServerSupabase();

    const { count: totalRegistered } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true });

    const { count: totalAttended } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('attendance_status', 'attended');

    const { data: cityData } = await supabase
      .from('attendees')
      .select('city, attendance_status')
      .limit(5000);

    const cityMap: Record<string, { total: number; attended: number }> = {};
    cityData?.forEach((a) => {
      const city = a.city || 'غير محدد';
      if (!cityMap[city]) cityMap[city] = { total: 0, attended: 0 };
      cityMap[city].total++;
      if (a.attendance_status === 'attended') cityMap[city].attended++;
    });

    const byCity = Object.entries(cityMap)
      .map(([city, stats]) => ({ city, count: stats.total, attended: stats.attended }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const total = totalRegistered || 0;
    const attended = totalAttended || 0;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_registered: total,
        total_attended: attended,
        attendance_rate: attendanceRate,
        by_city: byCity,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: 'خطأ في جلب الإحصائيات' }, { status: 500 });
  }
}