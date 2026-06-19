import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Verify auth token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { qr_data } = body;

    if (!qr_data) {
      return NextResponse.json({ success: false, message: 'بيانات QR مطلوبة' }, { status: 400 });
    }

    // Parse QR data
    let registrationNumber: string;
    try {
      const parsed = JSON.parse(qr_data);
      registrationNumber = parsed.reg;
    } catch {
      // Maybe it's a plain registration number
      registrationNumber = qr_data.trim();
    }

    if (!registrationNumber) {
      return NextResponse.json({ success: false, message: 'رمز QR غير صالح' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Find attendee by registration number
    const { data: attendee, error: findError } = await supabase
      .from('attendees')
      .select('*')
      .eq('registration_number', registrationNumber)
      .maybeSingle();

    if (findError || !attendee) {
      return NextResponse.json({ success: false, message: 'لم يتم العثور على هذا المشارك' }, { status: 404 });
    }

    // Already attended
    if (attendee.attendance_status === 'attended') {
      return NextResponse.json({
        success: false,
        alreadyAttended: true,
        attendee,
        message: `تم تسجيل حضور ${attendee.full_name} مسبقاً`,
      });
    }

    // Mark as attended
    const { data: updated, error: updateError } = await supabase
      .from('attendees')
      .update({
        attendance_status: 'attended',
        attendance_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', attendee.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ success: false, message: 'خطأ في تسجيل الحضور' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attendee: updated,
      message: `مرحباً ${updated.full_name}! تم تسجيل حضورك بنجاح ✓`,
    });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ success: false, message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
