import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.replace(/\D/g, '');

    if (!phone || phone.length < 8) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // FIX: Only return the specific attendee for this phone number
    // Never expose the full attendee list to the public
    const { data, error } = await supabase
      .from('attendees')
      .select('id, registration_number, full_name, phone_number, city, qr_code, attendance_status, registration_date, attendance_date')
      .eq('phone_number', phone)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: 'خطأ في البحث' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على تسجيل بهذا الرقم' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Retrieve error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}
