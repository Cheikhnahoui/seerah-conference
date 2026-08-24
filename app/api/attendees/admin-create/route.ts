import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateRegistrationNumber, validateName, validatePhone, formatPhoneNumber, verifyAdminToken } from '@/lib/utils';

/**
 * Admin-only endpoint to create an invitation directly from the admin
 * panel. Unlike the public registration endpoint, this skips the
 * "pending" WhatsApp-verification step entirely — the admin is
 * creating it themselves, so the identity is already known — and the
 * attendee is saved as immediately 'approved'.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone_number, city, occupation } = body;

    if (!validateName(full_name)) {
      return NextResponse.json({ success: false, error: 'اسم غير صالح' }, { status: 400 });
    }
    if (!validatePhone(phone_number)) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }

    const cleanedPhone = formatPhoneNumber(phone_number);
    const supabase = createServerSupabase();

    // Same duplicate check as public registration: match both the
    // modern E.164 form and the legacy digits-only form.
    const legacyDigits = cleanedPhone.replace(/^\+/, '');
    const { data: existing } = await supabase
      .from('attendees')
      .select('id, registration_number')
      .or(`phone_number.eq.${cleanedPhone},phone_number.eq.${legacyDigits}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف مسجل مسبقاً لدى مشارك آخر.' },
        { status: 409 }
      );
    }

    const registrationNumber = generateRegistrationNumber();

    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        registration_number: registrationNumber,
        full_name: full_name.trim(),
        phone_number: cleanedPhone,
        city: city?.trim() || null,
        occupation: occupation?.trim() || null,
        qr_code: null,
        attendance_status: 'registered',
        approval_status: 'approved',
        registration_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: attendee }, { status: 201 });
  } catch (error) {
    console.error('Admin create invitation error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}