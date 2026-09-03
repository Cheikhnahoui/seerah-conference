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

    // Accepted (approved) registrations — used as the denominator for
    // the attendance rate, since only approved people can actually
    // attend/check in.
    const { count: totalAccepted } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved');

    // Attendance is only meaningful among approved people, so this
    // count is scoped to approved + attended for consistency with the
    // rate calculation below.
    const { count: totalAttended } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('attendance_status', 'attended')
      .eq('approval_status', 'approved');

    const { data: cityData } = await supabase
      .from('attendees')
      .select('city, attendance_status, approval_status')
      .eq('approval_status', 'approved')
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

    const registered = totalRegistered || 0;
    const accepted = totalAccepted || 0;
    const attended = totalAttended || 0;
    // Attendance rate is calculated from ACCEPTED people only, not
    // the total registered — someone who was never approved could
    // never check in, so including them would understate the rate.
    const attendanceRate = accepted > 0 ? Math.round((attended / accepted) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_registered: registered,
        total_accepted: accepted,
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