import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';
import { formatForDisplay, isPlaceholderPhone } from '@/lib/phone';
import { formatDate } from '@/lib/utils';

/**
 * Exports every SELF-registered attendee (is_manual = false — i.e.
 * people who filled the public registration form themselves, as
 * opposed to entries the admin created manually), regardless of
 * approval_status (accepted / pending / rejected all included in the
 * same file, exactly as requested).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const { data: attendees, error } = await supabase
      .from('attendees')
      .select('full_name, phone_number, city, occupation, approval_status, attendance_status, registration_date')
      .eq('is_manual', false)
      .order('registration_date', { ascending: false });

    if (error) {
      console.error('Export self-registered query error:', error);
      return NextResponse.json({ success: false, error: 'خطأ في جلب البيانات' }, { status: 500 });
    }

    if (!attendees || attendees.length === 0) {
      return NextResponse.json({ success: false, error: 'لا يوجد أشخاص سجّلوا بأنفسهم بعد' }, { status: 404 });
    }

    const approvalLabel = (status: string | null) => {
      if (status === 'approved') return 'مقبول';
      if (status === 'rejected') return 'مرفوض';
      return 'قيد الانتظار';
    };

    const rows = attendees.map((a) => ({
      'الاسم': a.full_name,
      'رقم الهاتف': isPlaceholderPhone(a.phone_number) ? '—' : formatForDisplay(a.phone_number),
      'المدينة': a.city || '',
      'الصفة أو الوظيفة': a.occupation || '',
      'حالة الطلب': approvalLabel(a.approval_status),
      'حالة الحضور': a.attendance_status === 'attended' ? 'حاضر' : 'لم يحضر بعد',
      'تاريخ التسجيل': formatDate(a.registration_date),
    }));

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);

    // Reasonable column widths so the file is readable/printable as-is.
    ws['!cols'] = [
      { wch: 28 }, // الاسم
      { wch: 20 }, // رقم الهاتف
      { wch: 16 }, // المدينة
      { wch: 20 }, // الصفة
      { wch: 14 }, // حالة الطلب
      { wch: 14 }, // حالة الحضور
      { wch: 22 }, // تاريخ التسجيل
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المسجلون ذاتياً');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="self_registered_users.xlsx"',
      },
    });
  } catch (error) {
    console.error('Export self-registered error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي أثناء التصدير' }, { status: 500 });
  }
}