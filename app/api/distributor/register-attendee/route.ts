import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyDistributorToken } from '@/lib/distributorAuth';
import { generateRegistrationNumber, validateName, validatePhone, formatPhoneNumber, generateQrToken } from '@/lib/utils';
import { generatePlaceholderPhone } from '@/lib/phone';

/**
 * POST /api/distributor/register-attendee
 * محمي بتوكن الموزّع — يسجّل شخصاً جديداً مرتبطاً بهذا الموزّع تحديداً.
 * نفس منطق admin-create (approved فوراً + qr_token فوري)، لكن مع
 * ربط distributor_id ونطاق صلاحية أضيق (موزّع واحد فقط، لا وصول لأي
 * بيانات أخرى).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const session = verifyDistributorToken(token || null);

    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // تحقّق أن الموزّع لا يزال فعّالاً (وليس معطَّلاً منذ إصدار التوكن)
    const { data: distributor, error: distError } = await supabase
      .from('distributors')
      .select('id, is_active')
      .eq('id', session.distributorId)
      .maybeSingle();

    if (distError || !distributor || !distributor.is_active) {
      return NextResponse.json({ success: false, error: 'الحساب غير فعّال. تواصل مع الإدارة.' }, { status: 403 });
    }

    const body = await request.json();
    const { full_name, phone_number, city, occupation } = body;

    if (!validateName(full_name)) {
      return NextResponse.json({ success: false, error: 'اسم غير صالح' }, { status: 400 });
    }

    let cleanedPhone: string;
    const hasPhone = typeof phone_number === 'string' && phone_number.trim().length > 0;

    if (hasPhone) {
      if (!validatePhone(phone_number)) {
        return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
      }
      cleanedPhone = formatPhoneNumber(phone_number);

      const legacyDigits = cleanedPhone.replace(/^\+/, '');
      const { data: existing } = await supabase
        .from('attendees')
        .select('id')
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
    const qrToken = generateQrToken();

    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        registration_number: registrationNumber,
        qr_token: qrToken,
        full_name: full_name.trim(),
        phone_number: cleanedPhone,
        city: city?.trim() || null,
        occupation: occupation?.trim() || null,
        qr_code: null,
        attendance_status: 'registered',
        approval_status: 'approved',
        is_manual: true,
        delivery_status: 'not_delivered',
        distributor_id: session.distributorId,
        registration_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error (distributor register):', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: attendee }, { status: 201 });
  } catch (error) {
    console.error('Distributor register attendee error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}