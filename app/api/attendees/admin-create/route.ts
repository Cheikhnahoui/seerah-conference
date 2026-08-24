import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateRegistrationNumber, validateName, validatePhone, formatPhoneNumber, verifyAdminToken } from '@/lib/utils';
import { generatePlaceholderPhone } from '@/lib/phone';

/**
 * Admin-only endpoint to create an invitation directly from the admin
 * panel. Unlike the public registration endpoint, this skips the
 * "pending" WhatsApp-verification step entirely — the admin is
 * creating it themselves, so the identity is already known — and the
 * attendee is saved as immediately 'approved'.
 *
 * The phone number is OPTIONAL here: for guests whose number isn't
 * known yet, a unique internal placeholder is generated instead so
 * the person still gets a real, unique QR code and appears in the
 * attendee list like everyone else. They simply won't be able to
 * self-retrieve their invitation later (there's no real number for
 * them to search with) — the admin hands it to them directly.
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

    const supabase = createServerSupabase();
    let cleanedPhone: string;

    const hasPhone = typeof phone_number === 'string' && phone_number.trim().length > 0;

    if (hasPhone) {
      if (!validatePhone(phone_number)) {
        return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
      }
      cleanedPhone = formatPhoneNumber(phone_number);

      // Duplicate check only applies to real numbers — placeholders
      // are always unique by construction.
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
    } else {
      cleanedPhone = generatePlaceholderPhone();
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