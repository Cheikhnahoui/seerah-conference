import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateRegistrationNumber, validateName, validatePhone, formatPhoneNumber, verifyAdminToken } from '@/lib/utils';
import { generatePlaceholderPhone } from '@/lib/phone';

interface BulkRow {
  full_name: string;
  phone_number?: string;
  city?: string;
  occupation?: string;
}

interface RowResult {
  full_name: string;
  success: boolean;
  registration_number?: string;
  error?: string;
}

/**
 * Bulk version of admin-create: takes an array of rows (parsed from a
 * CSV on the client) and creates each one as an already-approved,
 * manually-created attendee with its own unique registration number /
 * QR code.
 *
 * The phone number is OPTIONAL for every row — this flow is meant for
 * guest lists where only the name is known. Rows without a phone get
 * a unique internal placeholder, exactly like the single manual-
 * creation flow, so they still get a real unique QR code and appear
 * everywhere the other attendees do. They just can't self-retrieve
 * their invitation later — the admin hands it to them directly (see
 * the manual-invitations gallery for delivery tracking).
 *
 * Each row is processed independently — one bad row (invalid name,
 * duplicate phone, etc.) does not block the rest of the batch.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const rows: BulkRow[] = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'لا توجد صفوف لإضافتها' }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ success: false, error: 'الحد الأقصى 500 صف في المرة الواحدة' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const results: RowResult[] = [];

    for (const row of rows) {
      const fullName = (row.full_name || '').trim();

      if (!validateName(fullName)) {
        results.push({ full_name: fullName || '(بدون اسم)', success: false, error: 'اسم غير صالح' });
        continue;
      }

      const hasPhone = typeof row.phone_number === 'string' && row.phone_number.trim().length > 0;
      let cleanedPhone: string;

      if (hasPhone) {
        if (!validatePhone(row.phone_number!)) {
          results.push({ full_name: fullName, success: false, error: 'رقم هاتف غير صالح' });
          continue;
        }
        cleanedPhone = formatPhoneNumber(row.phone_number!);

        const legacyDigits = cleanedPhone.replace(/^\+/, '');
        const { data: existing } = await supabase
          .from('attendees')
          .select('id')
          .or(`phone_number.eq.${cleanedPhone},phone_number.eq.${legacyDigits}`)
          .maybeSingle();

        if (existing) {
          results.push({ full_name: fullName, success: false, error: 'رقم الهاتف مسجل مسبقاً' });
          continue;
        }
      } else {
        cleanedPhone = generatePlaceholderPhone();
      }

      const registrationNumber = generateRegistrationNumber();

      const { data: attendee, error } = await supabase
        .from('attendees')
        .insert({
          registration_number: registrationNumber,
          full_name: fullName,
          phone_number: cleanedPhone,
          city: row.city?.trim() || null,
          occupation: row.occupation?.trim() || null,
          qr_code: null,
          attendance_status: 'registered',
          approval_status: 'approved',
          is_manual: true,
          delivery_status: 'not_delivered',
          registration_date: new Date().toISOString(),
        })
        .select('registration_number')
        .single();

      if (error || !attendee) {
        results.push({ full_name: fullName, success: false, error: 'خطأ أثناء الحفظ' });
        continue;
      }

      results.push({ full_name: fullName, success: true, registration_number: attendee.registration_number });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Bulk create error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}