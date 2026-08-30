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

    // Parse QR data. Two possible shapes:
    //  - { token: "<secure random qr_token>", app: "seerah-conf" }  (manual invitations — preferred, secure)
    //  - { reg: "<registration_number>", app: "seerah-conf" }        (legacy / public registrations)
    //  - a bare string (manual code entry) — tried as registration_number
    let qrToken: string | null = null;
    let registrationNumber: string | null = null;

    try {
      const parsed = JSON.parse(qr_data);
      if (parsed.token) qrToken = parsed.token;
      else if (parsed.reg) registrationNumber = parsed.reg;
    } catch {
      // Not JSON — treat as a plain registration number typed manually.
      registrationNumber = qr_data.trim();
    }

    if (!qrToken && !registrationNumber) {
      return NextResponse.json({ success: false, message: 'رمز QR غير صالح' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // ATOMIC UPDATE: only update if status is still 'registered'
    // This prevents race conditions — two simultaneous scans can't both succeed
    let updateQuery = supabase
      .from('attendees')
      .update({
        attendance_status: 'attended',
        attendance_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('attendance_status', 'registered'); // Only update if NOT already attended

    updateQuery = qrToken
      ? updateQuery.eq('qr_token', qrToken)
      : updateQuery.eq('registration_number', registrationNumber!);

    const { data: updated, error: updateError } = await updateQuery.select().maybeSingle();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ success: false, message: 'خطأ في تسجيل الحضور' }, { status: 500 });
    }

    // If update returned data → first time attendance
    if (updated) {
      return NextResponse.json({
        success: true,
        attendee: updated,
        message: `مرحباً ${updated.full_name}! تم تسجيل حضورك بنجاح ✓`,
      });
    }

    // No rows updated → either already attended or not found
    // Fetch to determine which case
    let findQuery = supabase.from('attendees').select('*');
    findQuery = qrToken
      ? findQuery.eq('qr_token', qrToken)
      : findQuery.eq('registration_number', registrationNumber!);

    const { data: attendee, error: findError } = await findQuery.maybeSingle();

    if (findError || !attendee) {
      return NextResponse.json({ success: false, message: 'لم يتم العثور على هذا المشارك' }, { status: 404 });
    }

    // Already attended
    return NextResponse.json({
      success: false,
      alreadyAttended: true,
      attendee,
      message: `تم تسجيل حضور ${attendee.full_name} مسبقاً`,
    });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ success: false, message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}