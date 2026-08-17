import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { normalizeSearchPhone } from '@/lib/phone';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone') || '';

    if (!rawPhone.trim()) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }

    // Normalize to E.164. Falls back to Mauritania when no country
    // hint (no leading "+") is present, to stay compatible with any
    // caller still sending bare digits.
    const { e164, legacyDigits } = normalizeSearchPhone(rawPhone, 'MR');

    if (!e164 && legacyDigits.length < 8) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Match either the modern E.164 form ("+22222123456") or the
    // legacy digits-only form some older records were saved with
    // ("22222123456"), so numbers registered before this update keep
    // working.
    const candidates = Array.from(
      new Set([e164, e164 ? e164.slice(1) : null, legacyDigits].filter(Boolean))
    ) as string[];

    const orFilter = candidates.map((c) => `phone_number.eq.${c}`).join(',');

    // FIX: Only return the specific attendee for this phone number
    // Never expose the full attendee list to the public
    const { data, error } = await supabase
      .from('attendees')
      .select('id, registration_number, full_name, phone_number, city, qr_code, attendance_status, registration_date, attendance_date')
      .or(orFilter)
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